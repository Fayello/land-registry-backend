import { Entity, PrimaryColumn, Column, UpdateDateColumn, BaseEntity } from "typeorm";

@Entity("system_configs")
export class SystemConfig extends BaseEntity {
    @PrimaryColumn()
    key: string;

    @Column()
    value: string;

    @Column({ nullable: true })
    description: string;

    @UpdateDateColumn()
    updated_at: Date;
}
