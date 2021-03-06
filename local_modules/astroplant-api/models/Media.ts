// tslint:disable
/**
 * AstroPlant API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import {
    AnyType,
} from './';

/**
 * @export
 * @interface Media
 */
export interface Media {
    /**
     * @type {string}
     * @memberof Media
     */
    id: string;
    /**
     * @type {number}
     * @memberof Media
     */
    peripheralId: number;
    /**
     * @type {number}
     * @memberof Media
     */
    kitId: number;
    /**
     * @type {number}
     * @memberof Media
     */
    kitConfigurationId: number;
    /**
     * @type {string}
     * @memberof Media
     */
    datetime: string;
    /**
     * @type {string}
     * @memberof Media
     */
    name: string;
    /**
     * @type {string}
     * @memberof Media
     */
    type: string;
    /**
     * @type {AnyType}
     * @memberof Media
     */
    metadata: AnyType;
    /**
     * @type {number}
     * @memberof Media
     */
    size: number;
}
