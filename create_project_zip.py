import os
import zipfile
import sys

def create_zip():
    root_dir = "/app/applet"
    output_public_zip = os.path.join(root_dir, "Hisaab-Pro-V1.0/frontend/public/evonix_hissab_project.zip")
    output_root_zip = os.path.join(root_dir, "evonix_hissab_project.zip")
    
    # Ensure public folder exists
    os.makedirs(os.path.dirname(output_public_zip), exist_ok=True)
    
    exclude_dirs = {
        'node_modules', '.git', 'dist', '.vite', '.aistudio', '__pycache__'
    }
    
    exclude_files = {
        'evonix_hissab_project.zip',
        'Hisaab_Pro_V1.0_Windows_Offline_Distribution.zip',
        'Hisaab_Pro_V1.0_Windows_Offline_Distribution.tar.gz',
        'create_project_zip.py',
        'temp_footer.txt',
        '.DS_Store'
    }
    
    def should_include(rel_path):
        parts = rel_path.split(os.sep)
        for part in parts:
            if part in exclude_dirs:
                return False
        filename = os.path.basename(rel_path)
        if filename in exclude_files:
            return False
        if filename.endswith('.tar.gz') or (filename.endswith('.zip') and filename != 'evonix-logo.svg'):
            return False
        return True

    print(f"Creating zip file at {output_public_zip} ...")
    
    files_added = 0
    with zipfile.ZipFile(output_public_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Walk through the root directory
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Prune exclude_dirs in place
            dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
            
            for f in filenames:
                full_path = os.path.join(dirpath, f)
                rel_path = os.path.relpath(full_path, root_dir)
                
                if should_include(rel_path):
                    # We store them under 'evonix-hissab/' prefix in the zip for clean extraction
                    arcname = os.path.join("evonix-hissab", rel_path)
                    zipf.write(full_path, arcname)
                    files_added += 1

        # Add Run_Windows.bat
        win_bat = (
            "@echo off\r\n"
            "title evonix Hissab - Accounting & ERP Suite\r\n"
            "echo ====================================================\r\n"
            "echo           evonix Hissab - evonix Technologies\r\n"
            "echo    Enterprise Financial Accounting & ERP System\r\n"
            "echo ====================================================\r\n"
            "echo.\r\n"
            "echo [1/2] Checking and installing dependencies...\r\n"
            "call npm install\r\n"
            "if %errorlevel% neq 0 (\r\n"
            "    echo [ERROR] npm install failed. Please make sure Node.js is installed.\r\n"
            "    pause\r\n"
            "    exit /b %errorlevel%\r\n"
            ")\r\n"
            "echo.\r\n"
            "echo [2/2] Launching application on http://localhost:3000 ...\r\n"
            "echo Open your browser at: http://localhost:3000\r\n"
            "echo Press Ctrl+C in this window to stop the server.\r\n"
            "echo ====================================================\r\n"
            "call npm run dev\r\n"
            "pause\r\n"
        )
        zipf.writestr("evonix-hissab/Run_Windows.bat", win_bat)
        files_added += 1

        # Add Run_Mac_Linux.sh
        mac_sh = (
            "#!/usr/bin/env bash\n"
            "set -e\n"
            "echo '===================================================='\n"
            "echo '          evonix Hissab - evonix Technologies'\n"
            "echo '   Enterprise Financial Accounting & ERP System'\n"
            "echo '===================================================='\n"
            "echo ''\n"
            "echo '[1/2] Checking and installing dependencies...'\n"
            "npm install\n"
            "echo ''\n"
            "echo '[2/2] Launching application on http://localhost:3000 ...'\n"
            "echo 'Open your browser at: http://localhost:3000'\n"
            "echo 'Press Ctrl+C to stop the server.'\n"
            "echo '===================================================='\n"
            "npm run dev\n"
        )
        zipinfo = zipfile.ZipInfo("evonix-hissab/Run_Mac_Linux.sh")
        zipinfo.external_attr = 0o755 << 16  # Make executable
        zipf.writestr(zipinfo, mac_sh)
        files_added += 1

        # Add README_HOW_TO_RUN.md
        readme_txt = (
            "# evonix Hissab (evonix Technologies)\n\n"
            "Enterprise Financial Accounting, UAE VAT 5% Compliance, Invoicing, Inventory & ERP Suite.\n\n"
            "## 🚀 چلانے کا طریقہ (How to Run on Windows / Mac / Linux)\n\n"
            "### طریقہ نمبر 1 (Windows کے لیے - سب سے آسان):\n"
            "1. اس زپ فائل (ZIP) کو کسی بھی فولڈر میں Extract (ان زپ) کریں۔\n"
            "2. فولڈر میں موجود `Run_Windows.bat` پر ڈبل کلک کریں۔\n"
            "3. سسٹم خودکار طریقے سے تمام ضروری پیکجز انسٹال کر کے پورٹل کو اسٹارٹ کر دے گا۔\n"
            "4. اپنا براؤزر کھولیں اور جائیں: `http://localhost:3000`\n\n"
            "---\n\n"
            "### طریقہ نمبر 2 (Manual Terminal / Command Prompt):\n"
            "1. اس فولڈر میں ٹرمینل یا Command Prompt اوپن کریں۔\n"
            "2. یہ کمانڈ چلائیں:\n"
            "   ```bash\n"
            "   npm install\n"
            "   ```\n"
            "3. انسٹال ہونے کے بعد یہ کمانڈ چلائیں:\n"
            "   ```bash\n"
            "   npm run dev\n"
            "   ```\n"
            "4. براؤزر میں `http://localhost:3000` اوپن کریں اور ایپ چیک کریں۔\n\n"
            "---\n\n"
            "### 📋 سسٹم کی معلومات (System Info):\n"
            "- **Portal Name:** evonix Hissab\n"
            "- **Company Name:** evonix Technologies\n"
            "- **Standard Currency:** AED (United Arab Emirates Dirham)\n"
            "- **Taxation:** UAE FTA 5% VAT & Corporate Tax Ready\n"
            "- **Default Login:** Hissabpro1@gmail.com (Password: 123456 یا جو آپ نے پاس ورڈ سیٹ کیا ہو)\n"
        )
        zipf.writestr("evonix-hissab/README_HOW_TO_RUN.md", readme_txt)
        files_added += 1

    # Also copy to root
    import shutil
    shutil.copyfile(output_public_zip, output_root_zip)
    
    zip_size_mb = os.path.getsize(output_public_zip) / (1024 * 1024)
    print(f"ZIP creation completed successfully! Added {files_added} files. File size: {zip_size_mb:.2f} MB")

if __name__ == "__main__":
    create_zip()
