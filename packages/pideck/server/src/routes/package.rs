use axum::Json;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};

use crate::models::{
    ApiResponse, ErrorBody, MarketplacePackage, OperationLog, OperationResult,
    PackageOperationRequest, PackageSearchResponse, PackageStatus,
};
use crate::routes::auth::require_auth;
use crate::server::state::AppState;
use crate::services::package;

#[utoipa::path(
    get,
    path = "/api/package/status",
    responses(
        (status = 200, description = "Package status", body = PackageStatus),
        (status = 401, description = "Unauthorized", body = ErrorBody),
    ),
    security(("bearer_auth" = [])),
    tag = "package"
)]
pub async fn status(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> (StatusCode, Json<ApiResponse<PackageStatus>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }

    let pkg_status = tokio::task::spawn_blocking({
        let config = state.config.package.clone();
        let app_config = state.config.clone();
        move || package::get_status(&config, &app_config)
    })
    .await
    .unwrap();

    (StatusCode::OK, Json(ApiResponse::ok(pkg_status)))
}

#[utoipa::path(
    post,
    path = "/api/package/install",
    responses(
        (status = 200, description = "Install result", body = OperationResult),
        (status = 401, description = "Unauthorized", body = ErrorBody),
    ),
    security(("bearer_auth" = [])),
    tag = "package"
)]
pub async fn install(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> (StatusCode, Json<ApiResponse<OperationResult>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }

    let result = tokio::task::spawn_blocking({
        let config = state.config.package.clone();
        let app_config = state.config.clone();
        move || package::install(&config, &app_config)
    })
    .await
    .unwrap();

    let status_str = if result.success { "success" } else { "failed" };
    let _ = state
        .db
        .log_operation("install", status_str, &result.output);

    (StatusCode::OK, Json(ApiResponse::ok(result)))
}

#[utoipa::path(
    post,
    path = "/api/package/update",
    responses(
        (status = 200, description = "Update result", body = OperationResult),
        (status = 401, description = "Unauthorized", body = ErrorBody),
    ),
    security(("bearer_auth" = [])),
    tag = "package"
)]
pub async fn update(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> (StatusCode, Json<ApiResponse<OperationResult>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }

    let result = tokio::task::spawn_blocking({
        let config = state.config.package.clone();
        let app_config = state.config.clone();
        move || package::update(&config, &app_config)
    })
    .await
    .unwrap();

    let status_str = if result.success { "success" } else { "failed" };
    let _ = state.db.log_operation("update", status_str, &result.output);

    (StatusCode::OK, Json(ApiResponse::ok(result)))
}

#[utoipa::path(
    get,
    path = "/api/package/logs",
    params(
        ("limit" = Option<i64>, Query, description = "Number of log entries to return (default: 50)")
    ),
    responses(
        (status = 200, description = "Operation logs", body = Vec<OperationLog>),
        (status = 401, description = "Unauthorized", body = ErrorBody),
    ),
    security(("bearer_auth" = [])),
    tag = "package"
)]
pub async fn logs(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Query(params): axum::extract::Query<LogsQuery>,
) -> (StatusCode, Json<ApiResponse<Vec<OperationLog>>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }

    let limit = params.limit.unwrap_or(50);
    match state.db.get_operation_logs(limit) {
        Ok(logs) => (StatusCode::OK, Json(ApiResponse::ok(logs))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::err(format!("Failed to fetch logs: {e}"))),
        ),
    }
}

#[derive(serde::Deserialize, utoipa::IntoParams)]
pub struct MarketplaceQuery {
    pub query: Option<String>,
    pub category: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[utoipa::path(get, path = "/api/packages", params(MarketplaceQuery), responses((status = 200, body = PackageSearchResponse)), security(("bearer_auth" = [])), tag = "packages")]
pub async fn marketplace_search(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Query(params): axum::extract::Query<MarketplaceQuery>,
) -> (StatusCode, Json<ApiResponse<PackageSearchResponse>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }
    match package::search(
        &state.http_client,
        params.query.as_deref(),
        params.category.as_deref(),
        params.page.unwrap_or(0),
        params.limit.unwrap_or(20).min(50),
    )
    .await
    {
        Ok(value) => (StatusCode::OK, Json(ApiResponse::ok(value))),
        Err(error) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::err(format!(
                "Registry request failed: {error}"
            ))),
        ),
    }
}

#[utoipa::path(get, path = "/api/packages/{name}", params(("name" = String, Path)), responses((status = 200, body = MarketplacePackage)), security(("bearer_auth" = [])), tag = "packages")]
pub async fn marketplace_detail(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(name): Path<String>,
) -> (StatusCode, Json<ApiResponse<MarketplacePackage>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }
    if !package::validate_name(&name) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::err("Invalid package name")),
        );
    }
    match package::detail(&state.http_client, &name).await {
        Ok(value) => (StatusCode::OK, Json(ApiResponse::ok(value))),
        Err(error) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::err(format!(
                "Registry request failed: {error}"
            ))),
        ),
    }
}

#[utoipa::path(get, path = "/api/packages/installed", responses((status = 200, body = OperationResult)), security(("bearer_auth" = [])), tag = "packages")]
pub async fn marketplace_installed(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> (StatusCode, Json<ApiResponse<OperationResult>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }
    let result = package::installed(&state.config.pi_binary());
    (StatusCode::OK, Json(ApiResponse::ok(result)))
}

#[utoipa::path(post, path = "/api/packages/operation", request_body = PackageOperationRequest, responses((status = 200, body = OperationResult)), security(("bearer_auth" = [])), tag = "packages")]
pub async fn marketplace_operation(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<PackageOperationRequest>,
) -> (StatusCode, Json<ApiResponse<OperationResult>>) {
    if let Err((code, msg)) = require_auth(&state, &headers).await {
        return (code, Json(ApiResponse::err(msg)));
    }
    let workspace_path = if request.scope == "project" {
        let Some(id) = request.workspace_id.as_deref() else {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::err("Project scope requires workspace_id")),
            );
        };
        match state.db.get_workspace(id) {
            Ok(Some(workspace)) => Some(std::path::PathBuf::from(workspace.path)),
            Ok(None) => {
                return (
                    StatusCode::NOT_FOUND,
                    Json(ApiResponse::err("Workspace not found")),
                );
            }
            Err(error) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::err(error.to_string())),
                );
            }
        }
    } else {
        None
    };
    let result = match request.operation.as_str() {
        "install" => package::operation(
            &state.config.pi_binary(),
            &request,
            workspace_path.as_deref(),
        ),
        "remove" | "update" => package::remove_or_update(
            &state.config.pi_binary(),
            &request,
            &request.operation,
            workspace_path.as_deref(),
        ),
        _ => Err(anyhow::anyhow!("Unsupported package operation")),
    };
    match result {
        Ok(value) => (StatusCode::OK, Json(ApiResponse::ok(value))),
        Err(error) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::err(error.to_string())),
        ),
    }
}

#[derive(serde::Deserialize, utoipa::IntoParams)]
pub struct LogsQuery {
    pub limit: Option<i64>,
}
