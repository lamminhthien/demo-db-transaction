
```ts
async processOrder(dto: CreateOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Tạo đơn
    const order = await tx.order.create({
      data: { userId: dto.userId, total: dto.total, status: 'CREATED' },
    });

    // 2. Trừ tồn kho từng sản phẩm
    for (const item of dto.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. Gọi cổng thanh toán
    const payment = await this.httpService.post(
      'https://gateway.vn/charge',
      { orderId: order.id, amount: dto.total },
    );

    // 4. Gửi email xác nhận
    await this.mailService.sendOrderConfirmation(order.id);

    // 5. Cập nhật trạng thái
    await tx.order.update({
      where: { id: order.id },
      data: { status: payment.ok ? 'PAID' : 'FAILED' },
    });

    return order;
  });
}
```

**Yêu cầu:**
- Liệt kê các vấn đề, giải thích hâu quả của từng vấn đề (lock giữ bao lâu? lỗi gì có thể xảy ra? tình huống nào làm dữ liệu sai?).
  - Em nhận thấy có nhiều vấn đề, transaction này khá bự và có thể kéo dài thời gian xử lý khá lâu qua nhiều process:
    - Với process call api thanh toán, nếu api call timeut lâu và failed thì transaction vĩnh viễn không đóng
    - Với process call api gửi email xác nhận cũng sẽ có vấn đề tương tự như call api thanh toán
    - Thậm chí cả process không có try catch block để commit khi thành công và rollback khi có lỗi xảy ra
- Viết lại thành phiên bản đúng
- Câu hỏi mở: với phiên bản đã sửa, nếu app **crash ngay sau khi** cổng thanh toán trả về thành công nhưng **trước khi** update status thi dữ liệu sẽ ở trạng thái nào? Đề xuất 1 hướng xử lý
- Em nghĩ app sẽ ở trạng thái initiated


