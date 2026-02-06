import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { Role } from "./Role";

export enum UserRole {
    BUYER = "buyer",
    OWNER = "owner",
    CLERK = "clerk",
    AGENT = "agent",
    CONSERVATOR = "conservator",
    CADASTRE = "cadastre", // Technical Authority (Survey/Mapping)
    NOTARY = "notary",
    SURVEYOR = "surveyor", // Field Professional
    GOVERNOR = "governor",
    MAYOR = "mayor",
    ADMIN = "admin",
}

@Entity("users")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    full_name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column({ nullable: true })
    phone_number: string;

    @Column({
        type: "simple-enum",
        enum: UserRole,
        default: UserRole.BUYER,
    })
    role: UserRole; // LEGACY: For static compatibility

    @ManyToOne(() => Role, (role) => role.users, { nullable: true })
    @JoinColumn({ name: "role_id" })
    role_obj: Role;

    @Column({ unique: true, nullable: true })
    national_id_number: string;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;
}
