import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

export enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed"
}

export enum PaymentPurpose {
    SEARCH_FEE = "search_fee",
    REGISTRATION_FEE = "registration_fee",
    TRANSFER_TAX = "transfer_tax"
}

@Entity("transactions")
export class Transaction extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    amount: number;

    @Column()
    currency: string; // XAF

    @Column({
        type: "simple-enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @Column({
        type: "simple-enum",
        enum: PaymentPurpose
    })
    purpose: PaymentPurpose;

    @Column({ nullable: true })
    external_transaction_id: string; // From MTN/Orange

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "payer_id" })
    payer: User;

    @Column({ nullable: true })
    payer_phone: string;

    @Column({ nullable: true })
    reference_id: string; // E.g., Deed Number or Case ID being paid for

    @CreateDateColumn()
    created_at: Date;

    @Column({ nullable: true })
    completed_at: Date;
}
