Quản lý database operations với Prisma.

## Instructions

Dựa vào argument để thực hiện:

- **`status`**: Chạy `npx prisma migrate status` để check migration state
- **`generate`**: Chạy `npx prisma generate` để regenerate client
- **`migrate <name>`**: Chạy `npx prisma migrate dev --name <name>`
- **`studio`**: Chạy `npx prisma studio` để mở DB browser
- **`seed`**: Chạy `npx prisma db seed`
- **`format`**: Chạy `npx prisma format` để format schema

Nếu không có argument, chạy `status` mặc định.

Luôn confirm với user trước khi chạy destructive operations (reset, push --force-reset).

$ARGUMENTS
