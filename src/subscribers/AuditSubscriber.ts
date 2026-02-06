import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";
import { AuditLog } from "../entities/AuditLog";
import { Deed } from "../entities/Deed";
import { Parcel } from "../entities/Parcel";

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
    /**
     * Listen to specific entities by filtering in the hooks
     */

    /**
     * Called before entity insertion.
     */
    async afterInsert(event: InsertEvent<any>) {
        if (event.metadata.tableName === "audit_logs") return;
        await this.log(event, "CREATE", event.entity);
    }

    /**
     * Called before entity update.
     */
    async afterUpdate(event: UpdateEvent<any>) {
        if (event.metadata.tableName === "audit_logs") return;
        // Calculate diff
        // Calculate diff safely
        const diff = {
            old: this.sanitize(event.databaseEntity),
            new: this.sanitize(event.entity),
        };
        await this.log(event, "UPDATE", undefined, diff);
    }

    /**
     * Called before entity removal.
     */
    async beforeRemove(event: RemoveEvent<any>) {
        await this.log(event, "DELETE", this.sanitize(event.databaseEntity));
    }

    private sanitize(entity: any) {
        if (!entity) return null;
        const seen = new WeakSet();

        return JSON.parse(JSON.stringify(entity, (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return "[Circular]";
                }
                seen.add(value);
            }
            // Mask passwords
            if (key === "password_hash") return "[REDACTED]";
            if (key === "digital_seal_hash") return "[SEAL]";
            return value;
        }));
    }

    private async log(event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>, action: string, entity?: any, diff?: any) {
        const audit = new AuditLog();
        audit.action = action;
        audit.target_table = event.metadata.tableName;
        audit.target_id = event.entity?.id || (event as any).databaseEntity?.id;
        audit.diff = diff || this.sanitize(entity);

        // In a real app, we would extract the actor_id from a RequestContext or similar cls-hooked storage
        // For now, we'll mark as 'SYSTEM' or 0 if not available within the subscriber context
        // Ideally, we pass the user via the QueryRunner data in the service layer
        audit.actor_id = event.queryRunner.data?.userId || null;

        await event.manager.save(audit); // Use the same transaction manager
    }
}
