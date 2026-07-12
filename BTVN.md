
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
  - Phiên bản đúng của em, em sẽ không để phần tạo order status created trong transaction mà em tách nó ra 1 query riêng lẻ, vì nếu có lỡ failed process thanh toán thì mình vẫn còn có order ở trạng thái created để mình đi fulfilled lại order
  - Với query trừ tồn kho sản phẩm, nên để trong transaction để tranh app lỗi thì còn có thể rollback data lại
  - Flow call api thanh toán sẽ nằm ngoài transaction. Chỉ khi thanh toán thành công thì mới mở transaction để trừ kho và cập nhật trạng thái order
  - Code em đã sửa:
  ```ts
  async processOrder(dto: CreateOrderDto) {
    // 1. Tạo order trước để luôn có record tham chiếu và có thể retry/reconcile về sau
    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        total: dto.total,
        status: 'CREATED',
      },
    });

    try {
      // 2. Gọi cổng thanh toán ngoài transaction để không giữ transaction quá lâu
      const payment = await this.httpService.post(
        'https://gateway.vn/charge',
        {
          orderId: order.id,
          amount: dto.total,
        },
      );

      if (!payment.ok) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        throw new Error('Payment failed');
      }

      // 3. Chỉ sau khi thanh toán thành công mới mở transaction để update kho hàng và update trạng thái đã mua hàng
      await this.prisma.$transaction(async (tx) => {
        for (const item of dto.items) {
          const product = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (product.count === 0) {
            throw new Error(`Product ${item.productId} is out of stock`);
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });
      });

      // 4. Gửi email thông báo
      await this.mailService.sendOrderConfirmation(order.id);

      return order;
    } catch (error) {
      // Nếu đã thanh toán tiền nhưng trừ kho thất bại, cần mark trạng thái để refund/reconcile, và nếu có audit log để ghi lại lịch sử update status order, nó sẽ dễ giúp mình đối chiếu thông tin tốt hơn
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'UPDATE_STOCK_FAILED' },
      });

      throw error;
    }
  }
  ```
- Câu hỏi mở: với phiên bản đã sửa, nếu app **crash ngay sau khi** cổng thanh toán trả về thành công nhưng **trước khi** update status thi dữ liệu sẽ ở trạng thái nào? Đề xuất 1 hướng xử lý
- Em nghĩ dữ liệu sẽ ở trạng thái created, nếu mà để cải thiện flow này hơn, thì em cần call thêm api check payment status trước khi gọi cổng thanh toán, để tránh việc user thanh toán hai lần


