import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Parcel } from "./Parcel";

export enum CaseType {
    NEW_REGISTRATION = "new_registration",
    TRANSFER = "transfer",
    SUBDIVISION = "subdivision",
    DISPUTE = "dispute",
}

export enum CaseStatus {
    PENDING_PAYMENT = "pending_payment",
    SUBMITTED = "submitted",
    PENDING_COMMISSION = "pending_commission",
    COMMISSION_VISIT = "commission_visit",
    TECHNICAL_VALIDATION = "technical_validation", // Cadastre Review
    OPPOSITION_PERIOD = "opposition_period",
    MUNICIPAL_INVESTIGATION = "municipal_investigation",
    UNDER_REVIEW = "under_review",
    GOVERNOR_APPROVAL = "governor_approval",
    APPROVED = "approved",
    REJECTED = "rejected",
}

@Entity("cases")
export class Case extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "simple-enum",
        enum: CaseType,
    })
    type: CaseType;

    @Column({
        type: "simple-enum",
        enum: CaseStatus,
        default: CaseStatus.SUBMITTED,
    })
    status: CaseStatus;

    @ManyToOne(() => User)
    @JoinColumn({ name: "initiator_id" })
    initiator: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: "assigned_to_id" })
    assigned_to: User;

    @ManyToOne(() => Parcel, { nullable: true })
    @JoinColumn({ name: "related_parcel_id" })
    related_parcel: Parcel;

    @Column("simple-json", { nullable: true })
    data: any; // Form data, upload URLs, etc.

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
