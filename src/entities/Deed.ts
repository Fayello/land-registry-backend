import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { User } from "./User";
import { Parcel } from "./Parcel";

@Entity("deeds")
export class Deed extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    deed_number: string;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: "parcel_id" })
    parcel: Parcel;

    @ManyToOne(() => User)
    @JoinColumn({ name: "owner_id" })
    owner: User;

    @Column({ nullable: true })
    vol: string;

    @Column({ nullable: true })
    folio: string;

    @Column({ nullable: true })
    department: string;

    @Column({ nullable: true })
    title_deed_url: string; // URL to the PDF/Scan S3 path

    @Column({ nullable: true })
    digital_seal_hash: string; // SHA-256

    @ManyToOne(() => User)
    @JoinColumn({ name: "conservator_id" })
    conservator: User; // The official who approved it

    @CreateDateColumn()
    registration_date: Date;

    @Column({ default: true })
    is_active: boolean;
}
