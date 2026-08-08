import { migrate as logger } from "../logger.js";

const migrateName = "service_keywords";

/**
 * Migrate
 *
 * @see http://knexjs.org/#Schema
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const up = (knex) => {
    logger.info(`[${migrateName}] Migrating Up...`);

    return knex.schema
        .alterTable('proxy_host', (table) => {
            table.string('service_keywords', 500).notNullable().defaultTo('');
        })
        .then(() => {
            logger.info(`[${migrateName}] proxy_host Table altered`);
        });
};

/**
 * Undo Migrate
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const down = (knex) => {
    logger.info(`[${migrateName}] Migrating Down...`);

    return knex.schema
        .alterTable('proxy_host', (table) => {
            table.dropColumn('service_keywords');
        })
        .then(() => {
            logger.info(`[${migrateName}] proxy_host Table altered`);
        });
};

export { up, down };
