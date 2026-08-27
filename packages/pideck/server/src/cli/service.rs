use std::fs;
use std::path::PathBuf;
use std::process::Command;

pub fn install() -> anyhow::Result<()> {
    if !cfg!(target_os = "linux") {
        anyhow::bail!("install-service currently supports Linux user systemd only");
    }

    let home = std::env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| anyhow::anyhow!("HOME is not set"))?;
    let unit_dir = home.join(".config/systemd/user");
    fs::create_dir_all(&unit_dir)?;

    let executable = std::env::current_exe()?;
    let data_dir = crate::config::AppConfig::data_dir();
    fs::create_dir_all(&data_dir)?;
    let unit = format!(
        "[Unit]\nDescription=PiDeck Companion\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nExecStart={} --headless\nWorkingDirectory={}\nRestart=on-failure\nRestartSec=3\n\n[Install]\nWantedBy=default.target\n",
        executable.display(),
        data_dir.display()
    );

    let unit_path = unit_dir.join("pideck.service");
    fs::write(&unit_path, unit)?;

    let reload = Command::new("systemctl")
        .args(["--user", "daemon-reload"])
        .status()?;
    anyhow::ensure!(reload.success(), "systemctl daemon-reload failed");

    let enable = Command::new("systemctl")
        .args(["--user", "enable", "--now", "pideck.service"])
        .status()?;
    anyhow::ensure!(enable.success(), "systemctl enable --now failed");

    println!("PiDeck service installed: {}", unit_path.display());
    Ok(())
}
