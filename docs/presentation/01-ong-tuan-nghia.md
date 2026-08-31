# Cẩm nang Người 1 — Ong Tuấn Nghĩa

## Vai trò trong câu chuyện

Mở bài, xác định phạm vi ba vai trò và đưa khách từ landing đến lúc tìm được quán/món. Thời lượng mục tiêu 3 phút 30 giây; không mở lần lượt mọi trang pháp lý/auth.

## Phải nắm sâu

| Phần | Logic/nghiệp vụ | Nguồn dữ liệu |
|---|---|---|
| `/`, `/faq`, pháp lý | Trang công khai; `/hop-tac` chuyển onboarding | Nội dung frontend và route React |
| Đăng ký | Chỉ customer; email chưa tồn tại; OTP 6 số, hash, 10 phút/5 lần; pending 30 phút | Auth API; `registration_pending`, `otp_codes`, `users`, `user_roles`, `customer_profiles` |
| Đăng nhập | Kiểm tra bcrypt và trạng thái tài khoản; redirect theo role; access + refresh rotation | Auth API; `users`, `user_roles`, `refresh_tokens` |
| Quên mật khẩu | Response chung chống dò email; OTP → reset token 15 phút; reset thu hồi phiên cũ | Auth API; `otp_codes`, `refresh_tokens` |
| `/app` | Banner/cuisine/quán nổi bật/món gần đây-thịnh hành/đặt lại; chỉ nội dung active | Home API; banners, settings, cuisines, restaurants, menu items, orders |
| `/app/search` | Tìm cả món và quán; lọc cuisine, giá, rating, vị trí; phân trang | Restaurants/menu-items APIs và tọa độ hiện tại |

Ghi nhớ: refresh token hiện nằm ở local/session storage; đây là giới hạn đã công bố. Không nói hệ thống có OAuth, SMS OTP hay đăng ký Admin tự do.

## Kịch bản demo

1. Nói bài toán và ba vai trò; nhấn mạnh nhà hàng tự giao/thuê ngoài.
2. Từ landing chỉ CTA, FAQ và link pháp lý; không mở hết.
3. Mô tả nhanh đăng ký OTP và đăng nhập điều hướng theo role bằng slide.
4. Đăng nhập sẵn Customer, mở Home; chỉ nguồn banner/cuisine/quán/món từ DB.
5. Tìm một món, áp một bộ lọc và mở quán để bàn giao Người 2.

## Trường hợp biên cần trả lời

- Tài khoản bị khóa không đăng nhập được; route guard frontend không thay thế authorization backend.
- OTP hết hạn/sai quá 5 lần phải gửi lại; quên mật khẩu không tiết lộ email tồn tại.
- Quán/món inactive hoặc ngoài phạm vi không được đưa vào trải nghiệm đặt hàng hợp lệ.
- Vị trí bị từ chối vẫn có thể tìm kiếm, nhưng một số xếp hạng theo khoảng cách bị giới hạn.

## Câu hỏi phản biện

- **Vì sao JWT và refresh token?** Access ngắn hạn giảm cửa sổ rủi ro; refresh rotation duy trì phiên và phát hiện token cũ.
- **Home có hard-code không?** Không; layout nằm ở frontend nhưng nội dung động lấy qua Home API từ DB.
- **Tìm kiếm tối ưu thế nào?** Backend lọc/phân trang; client debounce và gửi tiêu chí, không tải toàn bộ rồi lọc giả.
- **Ai có thể tự đăng ký?** Customer; Merchant qua onboarding, Admin được cấp có kiểm soát.

## Biết sơ lược phần còn lại

Người 2 hoàn thiện địa chỉ/giỏ; Người 3 tạo đơn an toàn; Người 4 theo dõi đến đánh giá; Người 5 xử lý đơn và doanh thu; Người 6 giám sát, đối soát và chứng minh chất lượng. Đọc phần 4–7 và 12 của `PRESENTATION_LIBRARY.md`.

## Câu chuyển giao

“Khách đã tìm thấy quán và món phù hợp. Như Ngọc sẽ trình bày dữ liệu chi tiết món, hồ sơ, địa chỉ và cách giỏ hàng được lưu nhất quán trước checkout.”
