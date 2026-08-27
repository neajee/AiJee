use axum::Json;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::path::PathBuf;
use utoipa::ToSchema;

use crate::models::ApiResponse;
use crate::routes::auth::require_auth;
use crate::server::state::AppState;

/// Mirrors pi's `getAgentDir()`: the `PI_CODING_AGENT_DIR` override wins over
/// `~/.pi/agent`. Writing to the wrong path would silently do nothing.
fn agent_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("PI_CODING_AGENT_DIR") {
        if !dir.is_empty() {
            let expanded = if let Some(rest) = dir.strip_prefix("~/") {
                let home = std::env::var("HOME").unwrap_or_else(|_| "/root".to_string());
                PathBuf::from(home).join(rest)
            } else {
                PathBuf::from(dir)
            };
            return expanded;
        }
    }
    let home = std::env::var("HOME").unwrap_or_else(|_| "/root".to_string());
    PathBuf::from(home).join(".pi/agent")
}

fn models_json_path() -> PathBuf {
    agent_dir().join("models.json")
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ModelCost {
    pub input: f64,
    pub output: f64,
    #[serde(rename = "cacheRead")]
    pub cache_read: f64,
    #[serde(rename = "cacheWrite")]
    pub cache_write: f64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CustomModelEntry {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api: Option<String>,
    #[serde(rename = "baseUrl", skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning: Option<bool>,
    /// `null` for a level marks it unsupported; a missing key means "provider default".
    #[serde(
        rename = "thinkingLevelMap",
        skip_serializing_if = "Option::is_none",
        default
    )]
    #[schema(value_type = Option<Object>)]
    pub thinking_level_map: Option<Map<String, Value>>,
    /// Accepted input modalities, e.g. `["text", "image"]`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost: Option<ModelCost>,
    #[serde(rename = "contextWindow", skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u64>,
    #[serde(rename = "maxTokens", skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u64>,
    /// Anything pi understands but PiDeck does not model (`headers`, `compat`, ...).
    /// Kept verbatim so a round-trip through this API is lossless.
    #[serde(flatten)]
    #[schema(ignore)]
    pub extra: Map<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CustomProvider {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "baseUrl", skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api: Option<String>,
    #[serde(rename = "apiKey", skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    #[serde(default)]
    pub models: Vec<CustomModelEntry>,
    /// `headers`, `compat`, `authHeader`, `modelOverrides`, ... preserved verbatim.
    #[serde(flatten)]
    #[schema(ignore)]
    pub extra: Map<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CustomModelsConfig {
    #[serde(default)]
    pub providers: std::collections::HashMap<String, CustomProvider>,
    /// Set when models.json exists but could not be parsed. The UI must refuse
    /// to save in that case, otherwise it would overwrite a file it cannot see.
    #[serde(rename = "parseError", skip_serializing_if = "Option::is_none")]
    pub parse_error: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct SaveCustomModelsRequest {
    pub providers: std::collections::HashMap<String, CustomProvider>,
}

fn empty_config() -> CustomModelsConfig {
    CustomModelsConfig {
        providers: std::collections::HashMap::new(),
        parse_error: None,
    }
}

/// Reads models.json. A file we cannot parse is reported as `parse_error`
/// rather than as "no providers", so the caller can avoid clobbering it.
fn read_config(path: &std::path::Path) -> CustomModelsConfig {
    if !path.exists() {
        return empty_config();
    }
    let content = match std::fs::read_to_string(path) {
        Ok(content) => content,
        Err(e) => {
            return CustomModelsConfig {
                parse_error: Some(format!("Failed to read {}: {e}", path.display())),
                ..empty_config()
            };
        }
    };
    match serde_json::from_str::<CustomModelsConfig>(&content) {
        Ok(config) => config,
        Err(e) => CustomModelsConfig {
            parse_error: Some(format!("Failed to parse {}: {e}", path.display())),
            ..empty_config()
        },
    }
}

#[utoipa::path(
    get,
    path = "/api/custom-models",
    responses(
        (status = 200, description = "Custom models config"),
    ),
    security(("bearer_auth" = [])),
    tag = "custom-models"
)]
pub async fn get_custom_models(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> (StatusCode, Json<ApiResponse<CustomModelsConfig>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }

    (
        StatusCode::OK,
        Json(ApiResponse::ok(read_config(&models_json_path()))),
    )
}

#[utoipa::path(
    put,
    path = "/api/custom-models",
    request_body = SaveCustomModelsRequest,
    responses(
        (status = 200, description = "Saved"),
    ),
    security(("bearer_auth" = [])),
    tag = "custom-models"
)]
pub async fn save_custom_models(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<SaveCustomModelsRequest>,
) -> (StatusCode, Json<ApiResponse<Value>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }

    let path = models_json_path();

    // Never overwrite a file we failed to parse: we would drop everything in it.
    if let Some(err) = read_config(&path).parse_error {
        return (
            StatusCode::CONFLICT,
            Json(ApiResponse::err(format!(
                "Refusing to overwrite models.json because it could not be read: {err}"
            ))),
        );
    }

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            if let Err(e) = std::fs::create_dir_all(parent) {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::err(format!("Failed to create directory: {e}"))),
                );
            }
        }
    }

    let config = CustomModelsConfig {
        providers: req.providers,
        parse_error: None,
    };

    match serde_json::to_string_pretty(&config) {
        Ok(json) => match std::fs::write(&path, json) {
            Ok(_) => (
                StatusCode::OK,
                Json(ApiResponse::ok(serde_json::json!({"saved": true}))),
            ),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::err(format!(
                    "Failed to write models.json: {e}"
                ))),
            ),
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::err(format!("Failed to serialize: {e}"))),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A models.json written by hand (or by pi itself) carries fields PiDeck's
    /// editor knows nothing about. Saving from the UI must not delete them.
    #[test]
    fn round_trip_preserves_unknown_fields() {
        let original = serde_json::json!({
            "providers": {
                "ollama": {
                    "name": "Ollama",
                    "baseUrl": "http://localhost:11434/v1",
                    "apiKey": "unused",
                    "api": "openai-completions",
                    "authHeader": false,
                    "headers": { "X-Trace": "on" },
                    "compat": { "supportsReasoningEffort": true },
                    "modelOverrides": {
                        "gpt-5": { "contextWindow": 400000 }
                    },
                    "models": [{
                        "id": "qwen3:8b",
                        "name": "Qwen3 8B",
                        "reasoning": true,
                        "thinkingLevelMap": { "xhigh": null, "high": "high" },
                        "input": ["text", "image"],
                        "cost": {
                            "input": 0.0, "output": 0.0,
                            "cacheRead": 0.0, "cacheWrite": 0.0
                        },
                        "contextWindow": 262144,
                        "maxTokens": 32768,
                        "headers": { "X-Model": "yes" },
                        "compat": { "thinkingFormat": "qwen" }
                    }]
                }
            }
        });

        let parsed: CustomModelsConfig = serde_json::from_value(original.clone())
            .expect("schema should accept pi's models.json");
        let written = serde_json::to_value(&parsed).expect("serialize");

        assert_eq!(
            written, original,
            "a save must be byte-for-byte lossless for fields PiDeck does not model"
        );
    }

    #[test]
    fn typed_fields_are_exposed_not_only_stashed_in_extra() {
        let parsed: CustomModelsConfig = serde_json::from_value(serde_json::json!({
            "providers": {
                "claude": {
                    "baseUrl": "https://example.test",
                    "models": [{
                        "id": "claude-opus-5",
                        "reasoning": true,
                        "input": ["text", "image"],
                        "contextWindow": 200000,
                        "maxTokens": 64000,
                        "cost": {
                            "input": 15.0, "output": 75.0,
                            "cacheRead": 1.5, "cacheWrite": 18.75
                        },
                        "thinkingLevelMap": { "minimal": null }
                    }]
                }
            }
        }))
        .expect("parse");

        let model = &parsed.providers["claude"].models[0];
        assert_eq!(model.reasoning, Some(true));
        assert_eq!(
            model.input.as_deref(),
            Some(["text".to_string(), "image".to_string()].as_slice())
        );
        assert_eq!(model.context_window, Some(200_000));
        assert_eq!(model.max_tokens, Some(64_000));
        assert_eq!(model.cost.as_ref().map(|c| c.output), Some(75.0));
        assert!(model.thinking_level_map.as_ref().unwrap()["minimal"].is_null());
        // Everything above is typed, so nothing should have leaked into `extra`.
        assert!(model.extra.is_empty(), "extra = {:?}", model.extra);
    }

    #[test]
    fn omitted_fields_stay_omitted() {
        // pi applies its own defaults (128k context, 16k maxTokens, text-only,
        // no reasoning). Writing nulls would fail pi's schema validation.
        let parsed: CustomModelsConfig = serde_json::from_value(serde_json::json!({
            "providers": { "p": { "baseUrl": "u", "models": [{ "id": "m" }] } }
        }))
        .expect("parse");

        let written = serde_json::to_string(&parsed).expect("serialize");
        assert_eq!(
            written,
            r#"{"providers":{"p":{"baseUrl":"u","models":[{"id":"m"}]}}}"#
        );
    }

    #[test]
    fn unreadable_file_is_reported_not_silently_emptied() {
        let dir = std::env::temp_dir().join(format!("pideck-models-{}", std::process::id()));
        std::fs::create_dir_all(&dir).expect("mkdir");
        let path = dir.join("models.json");
        std::fs::write(&path, "{ this is not json").expect("write");

        let config = read_config(&path);
        assert!(config.providers.is_empty());
        assert!(
            config.parse_error.is_some(),
            "a broken file must surface an error so the UI can refuse to save"
        );

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn missing_file_is_not_an_error() {
        let config = read_config(std::path::Path::new("/nonexistent/pideck/models.json"));
        assert!(config.providers.is_empty());
        assert!(config.parse_error.is_none());
    }
}
