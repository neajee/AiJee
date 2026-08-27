use std::process::Command;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use crate::models::{MarketplacePackage, PackageSearchResponse};

const REGISTRY: &str = "https://registry.npmjs.org";
const CACHE_TTL: Duration = Duration::from_secs(300);
static SEARCH_CACHE: OnceLock<
    Mutex<std::collections::HashMap<String, (Instant, PackageSearchResponse)>>,
> = OnceLock::new();

use crate::config::{AppConfig, PackageConfig};
use crate::models::{OperationResult, PackageStatus};

pub fn get_status(config: &PackageConfig, app_config: &AppConfig) -> PackageStatus {
    let name = &config.name;
    let npm = app_config.npm_binary();
    let installed_version = get_installed_version(name, &npm);
    let latest_version = get_latest_version(name, &npm);

    PackageStatus {
        name: name.clone(),
        installed: installed_version.is_some(),
        installed_version,
        latest_version,
    }
}

pub fn install(config: &PackageConfig, app_config: &AppConfig) -> OperationResult {
    let name = &config.name;
    let npm = app_config.npm_binary();
    run_command("install", &npm, &["install", "-g", name])
}

pub fn update(config: &PackageConfig, app_config: &AppConfig) -> OperationResult {
    let name = &config.name;
    let npm = app_config.npm_binary();
    // `npm update -g` is a no-op when the global root has no package.json /
    // lockfile to read a semver range from, so it can silently leave the
    // installed version untouched. Installing the `latest` tag always moves.
    run_command(
        "update",
        &npm,
        &["install", "-g", &format!("{name}@latest")],
    )
}

fn run_command(operation: &str, program: &str, args: &[&str]) -> OperationResult {
    run_command_in_dir(operation, program, args, None)
}

fn run_command_in_dir(
    operation: &str,
    program: &str,
    args: &[&str],
    cwd: Option<&std::path::Path>,
) -> OperationResult {
    let mut command = Command::new(program);
    command.args(args);
    if let Some(cwd) = cwd {
        command.current_dir(cwd);
    }
    let output = command.output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let combined = format!("{stdout}\n{stderr}").trim().to_string();

            OperationResult {
                operation: operation.to_string(),
                success: out.status.success(),
                output: combined,
            }
        }
        Err(e) => OperationResult {
            operation: operation.to_string(),
            success: false,
            output: format!("Failed to execute command: {e}"),
        },
    }
}

pub async fn search(
    client: &reqwest::Client,
    query: Option<&str>,
    category: Option<&str>,
    page: u32,
    limit: u32,
) -> anyhow::Result<PackageSearchResponse> {
    let key = format!(
        "{}|{}|{}|{}",
        query.unwrap_or(""),
        category.unwrap_or(""),
        page,
        limit
    );
    let cache = SEARCH_CACHE.get_or_init(|| Mutex::new(std::collections::HashMap::new()));
    if let Some((at, value)) = cache.lock().unwrap().get(&key).cloned() {
        if at.elapsed() < CACHE_TTL {
            let mut cached = value;
            cached.from_cache = true;
            return Ok(cached);
        }
    }
    let text = query.unwrap_or("").trim();
    let mut search_text = "keywords:pi-package".to_string();
    if !text.is_empty() {
        search_text.push(' ');
        search_text.push_str(text);
    }
    if let Some(category) = category.filter(|v| !v.is_empty() && *v != "all") {
        search_text.push(' ');
        search_text.push_str(category);
    }
    let url = format!("{REGISTRY}/-/v1/search");
    let response: serde_json::Value = client
        .get(url)
        .query(&[
            ("text", search_text),
            ("size", limit.to_string()),
            ("from", (page * limit).to_string()),
        ])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    let packages = response["objects"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(parse_search_package)
        .collect();
    let result = PackageSearchResponse {
        packages,
        total: response["total"].as_u64().unwrap_or(0),
        from_cache: false,
    };
    cache
        .lock()
        .unwrap()
        .insert(key, (Instant::now(), result.clone()));
    Ok(result)
}

pub async fn detail(client: &reqwest::Client, name: &str) -> anyhow::Result<MarketplacePackage> {
    let encoded = urlencoding::encode(name);
    let value: serde_json::Value = client
        .get(format!("{REGISTRY}/{encoded}"))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(parse_registry_package(&value, name))
}

fn parse_search_package(value: &serde_json::Value) -> Option<MarketplacePackage> {
    let package = &value["package"];
    let name = package["name"].as_str()?.to_string();
    let package_types = package_types_from_keywords(&package["keywords"]);
    Some(MarketplacePackage {
        name: name.clone(),
        version: package["version"].as_str().unwrap_or("unknown").to_string(),
        description: package["description"].as_str().map(str::to_string),
        author: package["publisher"]["username"]
            .as_str()
            .map(str::to_string),
        updated_at: package["date"].as_str().map(str::to_string),
        downloads: value["downloads"]["weekly"].as_u64(),
        repository: package["links"]["repository"].as_str().map(str::to_string),
        homepage: package["links"]["homepage"].as_str().map(str::to_string),
        npm_url: format!("https://www.npmjs.com/package/{name}"),
        package_types,
        readme: None,
    })
}

fn parse_registry_package(value: &serde_json::Value, fallback: &str) -> MarketplacePackage {
    let name = value["name"].as_str().unwrap_or(fallback).to_string();
    let package_types = package_types_from_keywords(&value["keywords"]);
    MarketplacePackage {
        name: name.clone(),
        version: value["version"].as_str().unwrap_or("unknown").to_string(),
        description: value["description"].as_str().map(str::to_string),
        author: value["author"]["name"]
            .as_str()
            .or_else(|| value["maintainers"][0]["name"].as_str())
            .map(str::to_string),
        updated_at: None,
        downloads: None,
        repository: value["repository"]["url"].as_str().map(str::to_string),
        homepage: value["homepage"].as_str().map(str::to_string),
        npm_url: format!("https://www.npmjs.com/package/{name}"),
        package_types,
        readme: value["readme"].as_str().map(str::to_string),
    }
}

fn package_types_from_keywords(value: &serde_json::Value) -> Vec<String> {
    let keywords = value
        .as_array()
        .map(|items| items.iter().filter_map(|v| v.as_str()).collect::<Vec<_>>())
        .unwrap_or_default();
    let mut result = Vec::new();
    for (needle, label) in [
        ("extension", "Extension"),
        ("skill", "Skill"),
        ("prompt", "Prompt"),
        ("theme", "Theme"),
    ] {
        if keywords
            .iter()
            .any(|value| value.eq_ignore_ascii_case(needle))
        {
            result.push(label.to_string());
        }
    }
    if result.is_empty() {
        result.push("Extension".to_string());
    }
    result
}

pub fn installed(pi: &str) -> OperationResult {
    run_command("list", pi, &["list"])
}

pub fn validate_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 214
        && name.split('/').all(|part| {
            !part.is_empty()
                && part
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | '@'))
        })
}

pub fn operation(
    pi: &str,
    request: &crate::models::PackageOperationRequest,
    cwd: Option<&std::path::Path>,
) -> anyhow::Result<OperationResult> {
    if !validate_name(&request.name) {
        anyhow::bail!("Invalid npm package name");
    }
    if !matches!(request.scope.as_str(), "global" | "project") {
        anyhow::bail!("Invalid install scope");
    }
    let source = format!(
        "npm:{}{}",
        request.name,
        request
            .version
            .as_deref()
            .map(|v| format!("@{v}"))
            .unwrap_or_default()
    );
    let mut args = vec!["install", source.as_str()];
    if request.scope == "project" {
        args.push("--local");
    }
    let result = run_command_in_dir("install", pi, &args, cwd);
    if result.success && request.lock_version.unwrap_or(false) && request.version.is_none() {
        return Ok(OperationResult {
            success: false,
            output: "锁定版本需要先选择具体版本".into(),
            operation: "install".into(),
        });
    }
    Ok(result)
}

pub fn remove_or_update(
    pi: &str,
    request: &crate::models::PackageOperationRequest,
    operation: &str,
    cwd: Option<&std::path::Path>,
) -> anyhow::Result<OperationResult> {
    if !validate_name(&request.name) {
        anyhow::bail!("Invalid npm package name");
    }
    if !matches!(request.scope.as_str(), "global" | "project") {
        anyhow::bail!("Invalid install scope");
    }
    let source = format!("npm:{}", request.name);
    let mut args = vec![operation, source.as_str()];
    if operation == "remove" && request.scope == "project" {
        args.push("--local");
    }
    let result = run_command_in_dir(operation, pi, &args, cwd);
    Ok(result)
}

fn get_installed_version(package_name: &str, npm: &str) -> Option<String> {
    let output = Command::new(npm)
        .args(["list", "-g", package_name, "--depth=0", "--json"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let json: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;
    let pkg_name = package_name
        .strip_prefix('@')
        .map_or(package_name, |_| package_name);
    json["dependencies"][pkg_name]["version"]
        .as_str()
        .map(|s| s.to_string())
}

fn get_latest_version(package_name: &str, npm: &str) -> Option<String> {
    let output = Command::new(npm)
        .args(["view", package_name, "version"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
