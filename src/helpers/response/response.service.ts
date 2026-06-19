import { Injectable } from '@nestjs/common';
import { Account, Category, CustomOrderOption, Image, Order, OrderItem, Payment, Product, User } from 'src/generated/prisma/client';
import { CategoryResponse } from 'src/models/category.model';
import { CustomOrderOptionResponse } from 'src/models/custom-order-option.model';
import { OrderItemResponse } from 'src/models/order-item.model';
import { DeliveryMethod, OrderResponse, OrderStatus } from 'src/models/order.model';
import { PaymentMethod, PaymentStatus } from 'src/models/payment.model';
import { ProductResponse, ProductType } from 'src/models/product.model';
import { Role, UserResponse } from 'src/models/user.model';
import WebResponse, { ErrorResponse, Paging } from 'src/models/web.model';

@Injectable()
export class ResponseService {
  public toAuthResponse(
    user: User & {
      accounts: Account[];
      orders: Order[];
      payments: Payment[];
    },
  ): UserResponse {
    return {
      id: user.id,
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? true : null,
      phone: user.phone,
      address: user.address,
      role: user.role as Role,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt.toString(),
      updatedAt: user.updatedAt.toString(),
      accounts: user.accounts.map((account) => ({
        ...account,
        createdAt: account.createdAt.toString(),
        updatedAt: account.updatedAt.toString(),
      })),
      orders: user.orders.map((order) => ({
        ...order,
        totalPrice: Number(order.totalPrice),
        status: order.status as OrderStatus,
        deliveryMethod: order.deliveryMethod as DeliveryMethod,
        paymentMethod: order.paymentMethod as PaymentMethod,
      })),
      payments: user.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod as PaymentMethod,
        status: payment.status as PaymentStatus,
        refundAmount: payment.refundAmount
          ? String(payment.refundAmount)
          : null,
        refundedAt: payment.refundedAt ? payment.refundedAt.toString() : null,
      })),
    };
  }

//   public toCloudinaryResponse(upload: UploadApiResponse): CloudinaryResponse {
//     return {
//       fileUrl: upload.secure_url,
//       publicId: upload.public_id,
//       originalFilename: upload.original_filename,
//       type: upload.type,
//       createdAt: upload.created_at,
//       updatedAt: upload.updated_at,
//     };
//   }

  public toCategoryResponse(
    category: Category & {
      products: Product[];
      children: Category[];
      parent?: Category | null;
    },
  ): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      children: category.children.map((child) => ({
        id: child.id,
        parentId: child.parentId,
        name: child.name,
        description: child.description,
      })),
      products: category.products.map((product) => ({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        type: product.type as ProductType,
        stock: product.stock,
      })),
      createdAt: category.createdAt.toString(),
      updatedAt: category.updatedAt.toString(),
    };
  }

  public toOrderItemResponse(
    orderItem: OrderItem & {
      order: Order;
      product: Product;
    },
  ): OrderItemResponse {
    return {
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      note: orderItem.note,
      priceEach: Number(orderItem.priceEach),
      order: {
        ...orderItem.order,
        totalPrice: Number(orderItem.order.totalPrice),
        status: orderItem.order.status as OrderStatus,
        deliveryMethod: orderItem.order.deliveryMethod as DeliveryMethod,
        paymentMethod: orderItem.order.paymentMethod as PaymentMethod,
      },
      product: {
        ...orderItem.product,
        price: Number(orderItem.product.price),
        type: orderItem.product.type as ProductType,
        stock: orderItem.product.stock,
      },
      createdAt: orderItem.createdAt.toString(),
      updatedAt: orderItem.updatedAt.toString(),
    };
  }

  public toOrderResponse(
    order: Order & {
      user: User;
      orderItems: OrderItem[];
      payment?: Payment | null;
    },
  ): OrderResponse {
    return {
      id: order.id,
      userId: order.userId,
      totalPrice: Number(order.totalPrice),
      status: order.status as OrderStatus,
      deliveryMethod: order.deliveryMethod as DeliveryMethod,
      paymentMethod: order.paymentMethod as PaymentMethod,
      user: order.user,
      orderItems: order.orderItems.map((orderItem) => ({
        ...orderItem,
        priceEach: Number(orderItem.priceEach),
      })),
      payment: order.payment
        ? {
            ...order.payment,
            amount: Number(order.payment.amount),
            paymentMethod: order.payment.paymentMethod as PaymentMethod,
            status: order.payment.status as PaymentStatus,
            refundAmount: order.payment.refundAmount
              ? String(order.payment.refundAmount)
              : null,
            refundedAt: order.payment.refundedAt
              ? order.payment.refundedAt.toString()
              : null,
          }
        : null,
      createdAt: order.createdAt.toString(),
      updatedAt: order.updatedAt.toString(),
    };
  }

  public toCustomOrderResponse(
    customOrder: CustomOrderOption & {
      product: Product;
    },
  ): CustomOrderOptionResponse {
    return {
      id: customOrder.id,
      productId: customOrder.productId,
      label: customOrder.label,
      placeholder: customOrder.placeholder,
      required: customOrder.required,
      product: {
        ...customOrder.product,
        price: Number(customOrder.product.price),
        type: customOrder.product.type as ProductType,
        stock: Number(customOrder.product.stock),
      },

      createdAt: customOrder.createdAt.toString(),
      updatedAt: customOrder.updatedAt.toString(),
    };
  }

  public toProductResponse(
    product: Product & {
      category: Category;
      orderItems: OrderItem[];
      customOrders: CustomOrderOption[];
      images: Image[];
    },
  ): ProductResponse {
    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      type: product.type as ProductType,
      stock: product.stock,
      createdAt: product.createdAt.toString(),
      updatedAt: product.updatedAt.toString(),
      category: product.category,
      orderItems: product.orderItems.map((orderItem) => ({
        ...orderItem,
        priceEach: Number(orderItem.priceEach),
      })),
      customOrders: product.customOrders.map((customOrder) => ({
        id: customOrder.id,
        productId: customOrder.productId,
        label: customOrder.label,
        placeholder: customOrder.placeholder,
        required: customOrder.required,
      })),
      images: product.images.map((image) => ({
        id: image.id,
        productId: image.productId,
        publicId: image.publicId,
        urls: image.urls,
      })),
    };
  }

  public success<T>(params: {
    data: T;
    message?: string;
    status?: number;
    paging?: Paging;
    code?: string;
  }): WebResponse<T> {
    return {
      success: true,
      message: params.message,
      status: params.status ?? 200,
      data: params.data,
      ...(params.paging && { paging: params.paging }),
      ...(params.code && { code: params.code }),
      timestamp: new Date().toISOString(),
    };
  }

  public error(params: {
    message: string;
    status?: number;
    errors?: ErrorResponse[];
    code?: string;
  }): WebResponse<null> {
    return {
      success: false,
      message: params.message,
      status: params.status ?? 500,
      errors: params.errors,
      code: params.code,
      timestamp: new Date().toISOString(),
    };
  }
}
