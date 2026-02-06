import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, Index, OneToOne, JoinColumn } from "typeorm";
import { Deed } from "./Deed";

export enum ParcelStatus {
    VALID = "valid",
    DISPUTED = "disputed",
    ARCHIVED = "archived",
}

@Entity("parcels")
export class Parcel extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    parcel_number: string;

    @Column()
    locality: string;

    @Column("decimal", { precision: 10, scale: 2 })
    area_sq_meters: number;

    // @Index({ spatial: true }) // Not supported in sqlite without extension
    @Column({
        type: "simple-json",
        nullable: true
    })
    boundary: any;

    @Column({
        type: "simple-enum",
        enum: ParcelStatus,
        default: ParcelStatus.VALID,
    })
    status: ParcelStatus;

    @OneToOne(() => Deed)
    @JoinColumn({ name: "current_deed_id" })
    current_deed: Deed;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
