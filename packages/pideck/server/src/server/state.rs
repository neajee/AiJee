use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use serde::{Deserialize, Serialize};

use crate::config::AppConfig;
use crate::db::Database;
use crate::services::agent::AgentManager;
use crate::services::connection::ConnectionInfo;
use crate::services::desktop::DesktopManager;
use crate::services::pairing::PairingManager;
use crate::services::port_scanner::PortScanner;
use crate::services::sse_registry::SseConnectionRegistry;
use crate::services::task::TaskManager;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActivePreview {
    pub session: String,
    pub hostname: String,
    pub port: String,
    pub token: String,
}

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<AppConfig>,
    pub db: Arc<Database>,
    pub pairing: PairingManager,
    pub agent: AgentManager,
    pub task_manager: TaskManager,
    pub port_scanner: Arc<PortScanner>,
    pub desktop: DesktopManager,
    pub http_client: reqwest::Client,
    pub instance_id: Arc<String>,
    pub sse_registry: SseConnectionRegistry,
    pub initialized: Arc<AtomicBool>,
    pub setup_code: Arc<String>,
    pub connection_info: Arc<ConnectionInfo>,
}

impl AppState {
    pub fn is_initialized(&self) -> bool {
        self.initialized.load(Ordering::Acquire)
    }
}
