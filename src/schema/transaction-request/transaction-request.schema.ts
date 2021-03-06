import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import {
  TransactionRequestRequestDetails,
  TransactionRequestRequestDetailsSchema,
} from './embedded/transaction-request-request-details.embedded';
import {
  TransactionRequestIdentification,
  TransactionRequestIdentificationSchema,
} from './embedded/transaction-request-identification.embedded';
import {
  TransactionRequestRequestForQuotes,
  TransactionRequestRequestForQuotesSchema,
} from './embedded/transaction-request-request-for-quotes.embedded';
import {
  TransactionRequestOrders,
  TransactionRequestOrdersSchema,
} from './embedded/transaction-request-orders.embedded';
import { OperationRequest } from 'src/schema/operation-request/operation-request.schema';

export enum TransactionRequestDocumentStatus {
  'requested',
  'approved',
  'pending',
  'completed',
  'refused',
}

export type TransactionRequestDocument = TransactionRequest & Document;

@Schema({ versionKey: false })
export class TransactionRequest {
  @Prop()
  transactionDate?: Date;

  @Prop({ type: TransactionRequestIdentificationSchema })
  identification?: TransactionRequestIdentification;

  @Prop({ type: TransactionRequestRequestDetailsSchema })
  requestDetails?: TransactionRequestRequestDetails;

  @Prop({ type: [TransactionRequestRequestForQuotesSchema] })
  requestForQuotes?: TransactionRequestRequestForQuotes[];

  @Prop({ type: [TransactionRequestOrdersSchema] })
  succededOrders?: TransactionRequestOrders[];

  @Prop({ type: [TransactionRequestOrdersSchema] })
  failedOrders?: TransactionRequestOrders[];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'OperationRequest' }] })
  requestedOperations?: OperationRequest[];

  @Prop({ type: String, enum: TransactionRequestDocumentStatus })
  status?: TransactionRequestDocumentStatus;
}

export const TransactionRequestSchema = SchemaFactory.createForClass(
  TransactionRequest,
);
