use std::path::Path;

use crate::{
    db::Database,
    terminal::{prompt_input, prompt_password},
};

pub fn reset(database_path: &Path) -> anyhow::Result<()> {
    let username =
        prompt_input("Username: ").ok_or_else(|| anyhow::anyhow!("Username cannot be empty"))?;
    let password = prompt_password("Password: ");
    let repeat = prompt_password("Repeat password: ");
    if username.len() < 3 || password.len() < 8 {
        anyhow::bail!("Username must be at least 3 characters and password at least 8 characters");
    }
    if password != repeat {
        anyhow::bail!("Passwords do not match");
    }
    if let Some(parent) = database_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)?;
    let db = Database::new(&database_path.to_string_lossy())?;
    db.revoke_all_auth()?;
    db.initialize_identity(&username, &hash)?;
    println!("Authentication reset. All login tokens and paired devices were revoked.");
    Ok(())
}
