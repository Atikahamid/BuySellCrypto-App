import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("custodial_wallets", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("address").notNullable();
        table.string("public_key").notNullable();
        table.string("provider").notNullable().defaultTo("local");
        table.jsonb("provider_data").nullable(); // e.g., turnkey IDs later
        table.timestamps(true, true);
    });

    await knex.schema.createTable("custodial_keys", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("wallet_id").references("id").inTable("custodial_wallets").onDelete("CASCADE");
        table.text("encrypted_secret").notNullable();
        table.timestamps(true, true);
    });

}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("custodial_keys");
    await knex.schema.dropTableIfExists("custodial_wallets");
}

