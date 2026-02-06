import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("audit_logs")
export class AuditLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    actor_id: number; // ID of the user who performed the action (nullable for system actions)

    @Column()
    action: string; // CREATE, UPDATE, DELETE

    @Column()
    target_table: string; // deeds, parcels

    @Column({ nullable: true })
    target_id: string; // ID of the modified record

    @Column("simple-json", { nullable: true })
    diff: any; // The changes made

    @CreateDateColumn()
    timestamp: Date;
}
