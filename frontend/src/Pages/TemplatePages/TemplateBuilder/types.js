/**
 * @typedef {Object} TreeItem
 * @property {string | number} id
 * @property {TreeItem[]} children
 * @property {boolean} [collapsed]
 * @property {string} [type] - 'group' or 'table'
 * @property {string} [name]
 */

/**
 * @typedef {Object} FlattenedItem
 * @property {string | number} id
 * @property {TreeItem[]} children
 * @property {boolean} [collapsed]
 * @property {string} [type]
 * @property {string} [name]
 * @property {string | number | null} parentId
 * @property {number} depth
 * @property {number} index
 */

/**
 * @typedef {Object} SensorContextValue
 * @property {FlattenedItem[]} items
 * @property {number} offset
 */

export const TreeItemSchema = {};
