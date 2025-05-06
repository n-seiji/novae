import fs from "fs";
import path from "path";

interface Package {
  name: string;
  version: string;
  type: "extension" | "script";
}

class PackageManager {
  private packages: Package[] = [];
  private configDir: string = path.join(
    process.env.HOME || "",
    ".config/novae"
  );
  // なおす
  private configPath: string = path.join(
    process.env.HOME || "",
    ".config/novae/config.json"
  );
  private extensionsDir: string = path.join(
    process.env.HOME || "",
    ".novae/extensions"
  );
  private scriptsDir: string = path.join(
    process.env.HOME || "",
    ".novae/scripts"
  );

  constructor() {
    this.loadConfig();
    this.createDirectories();
  }

  private loadConfig() {
    if (fs.existsSync(this.configPath)) {
      const data = fs.readFileSync(this.configPath, "utf-8");
      this.packages = JSON.parse(data);
    } else {
      this.packages = [];
      this.saveConfig();
    }
  }

  private saveConfig() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.packages, null, 2));
  }

  private createDirectories() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.extensionsDir)) {
      fs.mkdirSync(this.extensionsDir, { recursive: true });
    }
    if (!fs.existsSync(this.scriptsDir)) {
      fs.mkdirSync(this.scriptsDir, { recursive: true });
    }
  }

  install(pkg: Package) {
    this.createDirectories();
    this.loadConfig();

    this.packages.push(pkg);
    this.saveConfig();
    this.savePackageFile(pkg);
    console.log(`Installed ${pkg.name}@${pkg.version}`);
  }

  private savePackageFile(pkg: Package) {
    const dir = pkg.type === "extension" ? this.extensionsDir : this.scriptsDir;
    const filePath = path.join(dir, `${pkg.name}-${pkg.version}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
  }

  uninstall(pkgName: string) {
    const pkg = this.packages.find((pkg) => pkg.name === pkgName);
    if (pkg) {
      this.packages = this.packages.filter((pkg) => pkg.name !== pkgName);
      this.saveConfig();
      this.deletePackageFile(pkg);
      console.log(`Uninstalled ${pkgName}`);
    }
  }

  private deletePackageFile(pkg: Package) {
    const dir = pkg.type === "extension" ? this.extensionsDir : this.scriptsDir;
    const filePath = path.join(dir, `${pkg.name}-${pkg.version}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  list() {
    console.log("Installed packages:");
    this.packages.forEach((pkg) => {
      console.log(`${pkg.name}@${pkg.version} (${pkg.type})`);
    });
  }
}

// 使用例
const pm = new PackageManager();

const command = process.argv[2]; // コマンドを取得
const pkgName = process.argv[3]; // パッケージ名を取得
const pkgVersion = process.argv[4]; // バージョンを取得
const pkgType = process.argv[5]; // タイプを取得

switch (command) {
  case "install":
    if (pkgName && pkgVersion && pkgType) {
      if (pkgType !== "extension" && pkgType !== "script") {
        console.error("Type must be either 'extension' or 'script'");
        break;
      }
      pm.install({
        name: pkgName,
        version: pkgVersion,
        type: pkgType as "extension" | "script",
      });
    } else {
      console.error(
        "Usage: bun run src/index.ts install <name> <version> <type>"
      );
    }
    break;
  case "uninstall":
    if (pkgName) {
      pm.uninstall(pkgName);
    } else {
      console.error("Usage: bun run src/index.ts uninstall <name>");
    }
    break;
  case "list":
    pm.list();
    break;
  default:
    console.error("Unknown command. Use 'install', 'uninstall', or 'list'.");
}
