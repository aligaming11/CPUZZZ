# Hardware Inspector Pro (Windows Hardware Diagnostics)

Ứng dụng kiểm tra phần cứng Windows chuyên nghiệp với giao diện Dark Mode Fluent UI hiện đại, hỗ trợ đo lường thông số theo thời gian thực (Realtime) bởi **AliStudio Lab**.

---

## 🚀 Tính năng nổi bật
- ⚡ **Bộ vi xử lý (CPU)**: Tên chip, xung nhịp base/boost, số nhân/luồng, cache L1/L2/L3, kiến trúc tập lệnh, mức tải CPU realtime kèm đồ thị.
- 🧠 **Bộ nhớ RAM**: Dung lượng tổng/đang dùng dạng vòng cung cung tròn hiện đại, chi tiết từng thanh RAM (chuẩn DDR, bus MHz, Part Number, Serial).
- 🎮 **Card đồ họa (GPU)**: Thông tin GPU rời/onboard, VRAM, Driver version, Bus interface, màn hình và tần số quét (Hz).
- 💾 **Ổ đĩa & Lưu trữ (Storage)**: Danh sách ổ vật lý (NVMe, SSD, HDD), phân vùng C:, D:, dung lượng trống.
- 🔌 **Mainboard & BIOS**: Bo mạch chủ, nhà sản xuất, hãng và phiên bản BIOS.
- 🌐 **Mạng (Network)**: Đo tốc độ Download/Upload realtime dạng vòng cung kép, địa chỉ IPv4, MAC, kèm nút sao chép nhanh 1-click.
- 🌡️ **Nhiệt độ & Uptime**: Giám sát nhiệt độ CPU, thời gian hệ thống hoạt động.
- 📑 **Xuất báo cáo (Export Report)**: Xuất file báo cáo chi tiết specs máy tính dạng TXT chỉ với 1 click.

---

## 📦 Hướng Dẫn Cài Đặt Tự Động Từ GitHub Qua Git

### Cách 1: Chạy file `install.bat` (Đơn giản nhất trên Windows)
1. Clone repo về máy:
   ```cmd
   git clone https://github.com/aligaming11/CPUZZZ.git
   cd CPUZZZ
   ```
2. Nhấp đúp chuột vào file `install.bat`.
   - Script sẽ tự kiểm tra Git & Node.js, cài các gói cần thiết và tạo Shortcut **Hardware Inspector** ngay trên Desktop của bạn!

### Cách 2: Cài đặt tự động qua PowerShell (1 dòng lệnh)
Mở PowerShell (Run as Administrator) và chạy:
```powershell
irm https://raw.githubusercontent.com/aligaming11/CPUZZZ/main/install.ps1 | iex
```

---

## 🛠️ Đóng Gói File Cài Đặt Native Windows (.exe)

Bạn có thể tự build file cài đặt Native Windows (Installer hoặc Portable):

1. **Chạy script build nhanh**:
   Nhấp đúp chuột vào file `build.bat` và chọn:
   - `1`: Build **NSIS Setup Installer** (có wizard cài đặt, desktop shortcut, uninstaller)
   - `2`: Build **Portable .exe** (chạy ngay không cần cài đặt)
   - `3`: Build cả hai

2. **Hoặc build bằng lệnh NPM**:
   ```cmd
   npm run build:installer   # Tạo file Setup .exe (NSIS)
   npm run build:portable    # Tạo file Portable .exe
   npm run build:all         # Tạo cả 2 bản
   ```
   *File cài đặt xuất ra sẽ nằm trong thư mục `release/`.*

---

## 💻 Chạy Thử Chế Độ Phát Triển (Dev Mode)
```cmd
npm start
# hoặc chạy file run-dev.bat
```
