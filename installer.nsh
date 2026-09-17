; Custom NSIS installer script for Hardware Inspector
; AliStudio Lab — 2026

!define APP_NAME "Hardware Inspector"
!define APP_VERSION "2.0.0"
!define PUBLISHER "AliStudio Lab"

; Welcome page text
!define MUI_WELCOMEPAGE_TITLE "Chào mừng đến với ${APP_NAME}"
!define MUI_WELCOMEPAGE_TEXT "Bạn sắp cài đặt ${APP_NAME} v${APP_VERSION} bởi ${PUBLISHER}.$\r$\n$\r$\nỨng dụng kiểm tra phần cứng Windows chuyên nghiệp với giám sát realtime.$\r$\n$\r$\nNhấn Tiếp tục để tiếp tục cài đặt."

; Finish page
!define MUI_FINISHPAGE_TITLE "Cài đặt hoàn tất!"
!define MUI_FINISHPAGE_TEXT "${APP_NAME} đã được cài đặt thành công.$\r$\nNhấn Hoàn thành để khởi động ứng dụng."
!define MUI_FINISHPAGE_RUN "$INSTDIR\Hardware Inspector.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Khởi động Hardware Inspector ngay bây giờ"
