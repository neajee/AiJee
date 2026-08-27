pub mod auth;
pub mod init;
pub mod service;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "pideck", version, about = "Pi companion for pi-coding-agent")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,

    /// Optional path to the PiDeck configuration file
    #[arg(short, long)]
    pub config: Option<String>,

    /// Override listen port (default: from config or 5454)
    #[arg(short, long)]
    pub port: Option<u16>,

    /// Override listen host (default: from config or 0.0.0.0)
    #[arg(long)]
    pub host: Option<String>,

    /// Path to SQLite database file
    #[arg(long)]
    pub db: Option<String>,

    /// Print the QR code for mobile device pairing
    #[arg(long)]
    pub qr: bool,

    /// Run as a background gateway without a desktop shell
    #[arg(long)]
    pub headless: bool,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Initialize a new config.toml with interactive prompts
    Init,
    /// Hash a password for use in config.toml
    HashPassword {
        /// The password to hash
        password: String,
    },
    /// Install PiDeck as a per-user background service
    InstallService,
    /// Manage local authentication
    Auth {
        #[command(subcommand)]
        command: AuthCommands,
    },
}

#[derive(Subcommand)]
pub enum AuthCommands {
    /// Replace administrator credentials and revoke every token and paired device
    Reset,
}
