import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Permission } from "./Permission";
import { User } from "./User";

@Entity("roles")
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string; // e.g., "Conservator", "Cadastre", "Super Admin"

    @Column({ nullable: true })
    description: string;

    @ManyToMany(() => Permission, (permission) => permission.roles)
    @JoinTable({
        name: "role_permissions",
        joinColumn: { name: "role_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" }
    })
    permissions: Permission[];

    @OneToMany(() => User, (user) => user.role_obj)
    users: User[];
}
