mod cli;
mod config;
mod db;
mod models;
mod routes;
mod server;
mod services;
mod terminal;

use clap::Parser;

use crate::cli::{AuthCommands, Cli, Commands};

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let force_qr = cli.qr;
    let database_path = cli
        .db
        .as_deref()
        .map(std::path::PathBuf::from)
        .unwrap_or_else(config::AppConfig::default_database_path);

    match cli.command {
        Some(Commands::Init) => cli::init::run_init(),
        Some(Commands::HashPassword { password }) => {
            let hash = bcrypt::hash(&password, bcrypt::DEFAULT_COST)?;
            println!("password_hash = \"{hash}\"");
            Ok(())
        }
        Some(Commands::InstallService) => cli::service::install(),
        Some(Commands::Auth {
            command: AuthCommands::Reset,
        }) => cli::auth::reset(&database_path),
        None => tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()?
            .block_on(server::serve(cli, force_qr)),
    }
}
