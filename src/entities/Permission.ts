import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany } from "typeorm";
import { Role } from "./Role";

@Entity("permissions")
export class Permission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string; // e.g., "cases.sealing", "registry.create_parcel"

    @Column({ nullable: true })
    description: string;

    @ManyToMany(() => Role, (role: Role) => role.permissions)
    roles: Role[];
}
