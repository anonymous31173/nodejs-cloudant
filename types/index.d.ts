// Copyright © 2018 IBM Corp. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as nano from 'nano';
import { Request, CoreOptions } from "request";

declare function cloudant(
    config: cloudant.Configuration | string
  ): cloudant.ServerScope | cloudant.DatabaseScope;

declare namespace cloudant {
    type Callback<R> = (error: any, response: R, headers?: any) => void;

    interface ApiKey {
        key: string;
        password: string;
    }

    interface Security {
        [key: string]: string[];
    }

    interface SecurityResponse {
        [database: string]: Security;
    }

    interface CORS {
        enable_cors: boolean;
        allow_credentials: boolean;
        origins: string[];
    }

    interface VirtualHost {
        host: string;
        path: string;
    }

    interface SearchParams {
        q: string;
        include_docs?: boolean;
        bookmark?: string;
        limit?: number;
        skip?: number;
        stale?: string;
    }

    interface GeoParams {
        include_docs?: boolean;
        bookmark?: string;
        format?: string;
        limit?: number;
        skip?: number;
        stale?: string;
        bbox?: number[];
        lat?: number;
        lon?: number;
        rangex?: number;
        rangey?: number;
        radius?: number;
        g?: any;
        relation?: string;
        nearest?: boolean;
    }

    interface GeoResult {
        bookmark: string;
        features: any[];
        row: any[];
        type: string;
    }

    interface Configuration {
        account?: string;
        password?: string;
        vcapInstanceName?: string;
        vcapServices?: string;
        url?: string;
        cookie?: string;
        requestDefaults?: CoreOptions;
        log?(id: string, args: any): void;
        parseUrl?: boolean;
        request?(params: any): void;
    }

    interface ServerScope extends nano.ServerScope {
        db: DatabaseScope;
        use(db: string): DocumentScope<any>;
        scope(db: string): DocumentScope<any>;
        // https://console.bluemix.net/docs/services/Cloudant/api/authorization.html#authorization
        generate_api_key(callback: Callback<ApiKey>): void;

        // https://console.bluemix.net/docs/services/Cloudant/api/cors.html#cors
        set_cors(cors: CORS, callback?: Callback<any>): void;

        add_virtual_host(virtualHost: VirtualHost, callback?: Callback<any>): void;
        delete_virtual_host(virtualHost: VirtualHost, callback?: Callback<any>): void;
        get_virtual_hosts(callback?: Callback<any>): void;
    }

    interface DatabaseScope extends nano.DatabaseScope {
        set_security(Security: Security, callback: Callback<any>): void;
        get_security(callback: Callback<SecurityResponse>): void;
    }

    interface DocumentScope<D> extends nano.DocumentScope<D> {
        // https://console.bluemix.net/docs/services/Cloudant/api/search.html
        search(
            designname: string,
            searchname: string,
            params: SearchParams,
            callback: Callback<any>
        ): Request;

        // https://console.bluemix.net/docs/services/Cloudant/api/search.html
        search(
            designname: string,
            searchname: string,
            params: any,
            callback?: Callback<any>
        ): Request;
        // https://console.bluemix.net/docs/services/Cloudant/api/cloudant-geo.html#cloudant-geospatial
        geo(
            designname: string,
            docname: string,
            params: GeoParams,
            callback: Callback<GeoResult>
        ): Request;
    }
}

export = cloudant;