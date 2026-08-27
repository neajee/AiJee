use std::sync::atomic::Ordering;

use axum::{Json, extract::State, http::StatusCode};

use crate::{
    models::{ApiResponse, SetupCompleteResponse, SetupRequest, SetupStatusResponse},
    server::state::AppState,
};

pub async fn status(State(state): State<AppState>) -> Json<ApiResponse<SetupStatusResponse>> {
    Json(ApiResponse::ok(SetupStatusResponse {
        initialized: state.is_initialized(),
    }))
}

pub async fn initialize(
    State(state): State<AppState>,
    Json(request): Json<SetupRequest>,
) -> (StatusCode, Json<ApiResponse<SetupCompleteResponse>>) {
    if state.is_initialized() {
        return (
            StatusCode::GONE,
            Json(ApiResponse::err("Setup is permanently closed")),
        );
    }
    if request.code != *state.setup_code {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::err("Invalid setup code")),
        );
    }
    let username = request.username.trim();
    if username.len() < 3 || request.password.len() < 8 {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ApiResponse::err(
                "Username must be at least 3 characters and password at least 8 characters",
            )),
        );
    }
    if request.password != request.password_confirm {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ApiResponse::err("Passwords do not match")),
        );
    }
    let hash = match bcrypt::hash(&request.password, bcrypt::DEFAULT_COST) {
        Ok(hash) => hash,
        Err(error) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::err(error.to_string())),
            );
        }
    };
    match state.db.initialize_identity(username, &hash) {
        Ok(_) => {
            match state.db.create_auth_session(
                username,
                state.config.auth.access_token_ttl_minutes,
                state.config.auth.refresh_token_ttl_days,
            ) {
                Ok(session) => {
                    state.initialized.store(true, Ordering::Release);
                    state
                        .connection_info
                        .print_qr(&state.pairing.current_qr_id(), state.config.server_id());
                    (
                        StatusCode::CREATED,
                        Json(ApiResponse::ok(SetupCompleteResponse {
                            initialized: true,
                            server_id: state.config.server_id().to_string(),
                            access_token: session.access_token,
                            refresh_token: session.refresh_token,
                            access_expires_at: session.access_expires_at,
                            refresh_expires_at: session.refresh_expires_at,
                        })),
                    )
                }
                Err(error) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::err(error.to_string())),
                ),
            }
        }
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::err(error.to_string())),
        ),
    }
}
