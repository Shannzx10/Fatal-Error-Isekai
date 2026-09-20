/***
  @ Base: Leonardo AI (AWS Cognito SRP + GraphQL API)
  @ Author: Reverse Engineered
  @ Note: Signup, Confirm, Login, Token Refresh, Blueprints.
  @ Updated: Amplify Android SDK compatible SRP implementation
***/

import axios from 'axios';
import crypto from 'crypto';

const CONFIG = {
    COGNITO: {
        CLIENT_ID: '5i7j910t573mlmqc1k36vk5m9i',
        USER_POOL_ID: 'us-east-1_xkVMuCqeu',
        REGION: 'us-east-1',
        URL: 'https://cognito-idp.us-east-1.amazonaws.com',
        POOL_NAME: 'xkVMuCqeu'
    },
    API: {
        URL: 'https://api.leonardo.ai/v1/graphql',
        HEADERS: {
            'User-Agent': 'LeonardoAi-Android/2.0.39',
            'Accept': 'multipart/mixed;deferSpec=20220824, application/graphql-response+json, application/json',
            'Content-Type': 'application/json'
        }
    },
    HEADERS: {
        'User-Agent': 'aws-sdk-kotlin/1.3.81 ua/2.1 api/cognito-identity-provider#1.3.81 os/android#5.15.149-android13-8-00008-gbe074b05e5af-ab12096863 lang/kotlin#2.3.20 md/javaVersion#0 md/jvmName#Dalvik md/jvmVersion#2.1.0 md/androidApiVersion#35 md/androidRelease#15 lib/amplify-android#2.29.1 md/locale#id_ID md/Xiaomi#25028RN03Am/E',
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/x-amz-json-1.1',
        'x-amz-user-agent': 'aws-sdk-kotlin/1.3.81',
        'amz-sdk-request': 'attempt=1; max=3'
    },
    SRP: {
        N: BigInt('0x' + 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF'),
        G: 2n
    }
};

const H = {
    uuid: () => crypto.randomUUID(),

    hexToBigInt: (hex) => BigInt('0x' + hex),

    bigIntArray: (n) => {
        if (n === 0n) return new Uint8Array([0]);
        const hex = n.toString(16);
        const padded = hex.length % 2 ? '0' + hex : hex;
        const buf = Buffer.from(padded, 'hex');
        return buf[0] & 0x80 ? Buffer.concat([Buffer.from([0]), buf]) : buf;
    },

    powMod: (base, exp, mod) => {
        let r = 1n;
        base = ((base % mod) + mod) % mod;
        while (exp > 0n) {
            if (exp & 1n) r = (r * base) % mod;
            exp >>= 1n;
            base = (base * base) % mod;
        }
        return r;
    },

    hmac: (key, data) => crypto.createHmac('sha256', key).update(data).digest(),

    body: (obj) => JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v),

    ts: () => {
        const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const t = new Date();
        return `${d[t.getUTCDay()]} ${m[t.getUTCMonth()]} ${t.getUTCDate()} ${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}:${String(t.getUTCSeconds()).padStart(2, '0')} UTC ${t.getUTCFullYear()}`;
    },

    req: async (target, body) => {
        const res = await axios({
            method: 'POST',
            url: CONFIG.COGNITO.URL,
            headers: { ...CONFIG.HEADERS, 'x-amz-target': target, 'amz-sdk-invocation-id': H.uuid() },
            data: H.body(body)
        });
        return res.data;
    },

    gql: async (idToken, operationName, query, variables = {}) => {
        const res = await axios({
            method: 'POST',
            url: CONFIG.API.URL,
            headers: { ...CONFIG.API.HEADERS, 'authorization': 'Bearer ' + idToken },
            data: JSON.stringify({ operationName, variables, query, extensions: { clientLibrary: { name: 'apollo-kotlin', version: '4.3.2' } } })
        });
        return res.data;
    }
};

const S = {
    keyPair: () => {
        const a = H.hexToBigInt(crypto.randomBytes(32).toString('hex'));
        return { a, A: H.powMod(CONFIG.SRP.G, a, CONFIG.SRP.N) };
    },

    x: (salt, userId, password) => {
        const h1 = crypto.createHash('sha256');
        h1.update(Buffer.from(CONFIG.COGNITO.POOL_NAME, 'utf-8'));
        h1.update(Buffer.from(userId, 'utf-8'));
        h1.update(Buffer.from(':', 'utf-8'));
        h1.update(Buffer.from(password, 'utf-8'));

        const h2 = crypto.createHash('sha256');
        h2.update(H.bigIntArray(salt));
        h2.update(h1.digest());
        return BigInt('0x' + h2.digest('hex'));
    },

    k: () => {
        const d = crypto.createHash('sha256');
        d.update(H.bigIntArray(CONFIG.SRP.N));
        d.update(H.bigIntArray(CONFIG.SRP.G));
        return BigInt('0x' + d.digest('hex'));
    },

    u: (A, B) => {
        const d = crypto.createHash('sha256');
        d.update(H.bigIntArray(A));
        d.update(H.bigIntArray(B));
        return BigInt('0x' + d.digest('hex'));
    },

    session: (u, x, a, B, k) => {
        const gx = H.powMod(CONFIG.SRP.G, x, CONFIG.SRP.N);
        let s = (B - (k * gx % CONFIG.SRP.N)) % CONFIG.SRP.N;
        if (s < 0n) s += CONFIG.SRP.N;
        return H.powMod(s, a + u * x, CONFIG.SRP.N);
    },

    key: (S, u) => {
        const prk = H.hmac(H.bigIntArray(u), H.bigIntArray(S));
        return H.hmac(prk, Buffer.concat([Buffer.from('Caldera Derived Key', 'utf-8'), Buffer.from([0x01])])).subarray(0, 16);
    },

    sig: (key, secretBlock, userId) => {
        const sb = Buffer.from(secretBlock, 'base64');
        const ts = H.ts();
        const sig = crypto.createHmac('sha256', key)
            .update(CONFIG.COGNITO.POOL_NAME)
            .update(userId)
            .update(sb)
            .update(ts)
            .digest('base64');
        return { sig, ts };
    }
};

// ============================================================
// MODEL CATEGORIES (extracted from APK n0/z.smali)
// ============================================================
const MODEL_CATEGORIES = {
    image: [
        { id: 'all', name: 'All' },
        { id: 'real-and-cinematic', name: 'Real & Cinematic' },
        { id: 'artistic', name: 'Artistic' },
        { id: 'design-and-marketing', name: 'Design & Marketing' },
        { id: 'edit-and-experiment', name: 'Edit & Experiment' },
        { id: 'text-and-typography', name: 'Text & Typography' },
    ],
    video: [
        { id: 'all', name: 'All' },
        { id: 'cinematic-and-realism', name: 'Cinematic & Realism' },
        { id: 'stylised-and-animation', name: 'Stylised & Animation' },
        { id: 'content-and-social', name: 'Content & Social' },
        { id: 'quick-and-experimental', name: 'Quick & Experimental' },
        { id: 'sound-and-dialogue', name: 'Sound & Dialogue' },
        { id: 'long-form', name: 'Long Form' },
    ]
};

// Preset UUID → categories (from APK sparse-switch in method b)
const PRESET_CATEGORIES = {
    '02dff998-e678-416c-a8a7-ce93188f2e68': ['all', 'artistic', 'edit-and-experiment'],
    '5478273a-68e1-4efe-a0c4-3fe84e4c16a8': ['all', 'artistic'],
    'b617c6b4-ae27-4a70-b0df-6ca593c8e681': ['all', 'real-and-cinematic', 'design-and-marketing', 'text-and-typography'],
    'b2614463-296c-462a-9586-aafdb8f00e36': ['all', 'real-and-cinematic'],
    '21278dfe-ac26-4292-82e0-8e588373a30c': ['all', 'design-and-marketing', 'edit-and-experiment'],
    'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3': ['all', 'design-and-marketing', 'text-and-typography'],
    '8318d93c-4d56-4de2-a589-53c44a38439f': ['all', 'real-and-cinematic', 'design-and-marketing', 'text-and-typography'],
    '135b2740-a20b-48c8-8f86-6f68199e06c5': ['all', 'design-and-marketing', 'edit-and-experiment'],
    '6b645e3a-d64f-4341-a6d8-7a3690fbf042': ['all', 'design-and-marketing'],
    'ec89afed-f1a7-40e2-91ef-41822bb83d06': ['all', 'real-and-cinematic', 'design-and-marketing', 'edit-and-experiment', 'text-and-typography'],
    '4a008a65-8d97-44f5-97a0-66c431612614': ['all', 'design-and-marketing', 'edit-and-experiment'],
    '8d1d4062-d08d-4f22-9a46-970b60fa9d85': ['all', 'design-and-marketing', 'edit-and-experiment', 'text-and-typography'],
    '7b592283-e8a7-4c5a-9ba6-d18c31f258b9': ['all', 'artistic', 'real-and-cinematic', 'text-and-typography'],
    '7a9534eb-1650-4e1d-8288-1145b3e3fa0b': ['all', 'design-and-marketing', 'edit-and-experiment', 'text-and-typography'],
    '7418e71f-4133-4e1b-9895-bee19f48f2ce': ['all', 'design-and-marketing', 'edit-and-experiment'],
    'f9672904-3313-4867-b883-407ef6a0edec': ['all', 'design-and-marketing', 'text-and-typography'],
    'f75b1998-e5cb-4fdf-9eef-98e8186c2c2f': ['all', 'design-and-marketing', 'edit-and-experiment'],
    '05ce0082-2d80-4a2d-8653-4d1c85e2418e': ['all', 'real-and-cinematic'],
    '28aeddf8-bd19-4803-80fc-79602d1a9989': ['all', 'design-and-marketing', 'edit-and-experiment'],
    '7c02ef35-3a6b-4df6-b78d-873e5032c3b4': ['all', 'design-and-marketing', 'edit-and-experiment', 'text-and-typography'],
    '94515e81-e589-4a5b-aeae-10ced50142c2': ['all', 'real-and-cinematic'],
    'f1c295ea-1575-445f-89ae-9b4013a6a37c': ['all', 'real-and-cinematic', 'edit-and-experiment', 'text-and-typography'],
    '17b4c03d-f89b-4b84-a867-466d482a9b3b': ['all', 'real-and-cinematic', 'edit-and-experiment'],
    '99ecc726-3404-412c-9dc1-24d4cdef2299': ['all', 'design-and-marketing', 'edit-and-experiment'],
    '1dd50843-d653-4516-a8e3-f0238ee453ff': ['all', 'edit-and-experiment'],
};

// Video model sets (modelId string → category)
const VIDEO_MODEL_SETS = {
    'cinematic-and-realism': [
        'veo-3.1-generate-001', 'sora-2', 'kling-3.0', 'kling-video-o-3', 'kling-video-o-1',
        'seedance-1.0-pro', 'ltxv-2.0-pro', 'ltxv-2.0-fast', 'ltxv-2.0-ultra', 'ltxv-2.3-pro',
        'ltxv-2.3-fast', 'veo-3.1-fast-generate-001', 'sora-2-pro', 'seedance-1.0-pro-fast',
        'kling-2.5', 'kling-2.5-turbo-standard', 'seedance-2.0-fast', 'kling-3.0-turbo',
        'bytedance/seedance-2.5', 'alibaba/wan-3.0', 'wan-2.7', 'wan-2.6', 'hailuo-03',
        'bfl/flux-3-video', 'gemini-omni-flash', 'grok-imagine-1.5', 'happy-horse', 'happy-horse-1.1'
    ],
    'stylised-and-animation': [
        'hailuo-2_3-fast', 'motion_2.0-fast', 'hailuo-2_3', 'motion_2.0', 'motion_1.0'
    ],
    'content-and-social': [
        'seedance-1.0-pro', 'seedance-1.0-lite', 'seedance-2.0', 'kling-2.6', 'kling-2.1',
        'seedance-1.0-pro-fast', 'bytedance/seedance-2.5', 'seedance-2.0-mini', 'alibaba/wan-3.0',
        'wan-2.6', 'happy-horse', 'happy-horse-1.1', 'grok-imagine-1.5'
    ],
    'quick-and-experimental': [
        'motion_2.0-fast', 'veo-3.1-fast-generate-001', 'seedance-1.0-pro-fast',
        'kling-2.5-turbo-standard', 'hailuo-2_3-fast', 'motion_1.0', 'seedance-2.0-fast',
        'veo-3.1-lite', 'kling-3.0-turbo', 'seedance-2.0-mini', 'gemini-omni-flash'
    ],
    'sound-and-dialogue': [
        'veo-3.1-generate-001', 'veo-3.1-fast-generate-001', 'veo-3.1-lite', 'kling-3.0',
        'kling-video-o-3', 'seedance-2.0', 'seedance-2.0-fast', 'seedance-2.0-mini',
        'bytedance/seedance-2.5', 'alibaba/wan-3.0', 'bfl/flux-3-video'
    ],
    'long-form': [
        'alibaba/wan-3.0', 'wan-2.6', 'bytedance/seedance-2.5', 'seedance-2.0',
        'seedance-2.0-fast', 'seedance-2.0-mini', 'bfl/flux-3-video', 'ltxv-2.3-fast',
        'hailuo-03', 'grok-imagine-1.5', 'happy-horse', 'happy-horse-1.1', 'kling-3.0',
        'kling-3.0-turbo', 'kling-video-o-3'
    ]
};

export const leonardo = {
    signup: async (email, password) => {
        return await H.req('AWSCognitoIdentityProviderService.SignUp', {
            ClientId: CONFIG.COGNITO.CLIENT_ID,
            Password: password,
            UserAttributes: [],
            Username: email
        });
    },

    confirmSignup: async (email, code) => {
        return await H.req('AWSCognitoIdentityProviderService.ConfirmSignUp', {
            ClientId: CONFIG.COGNITO.CLIENT_ID,
            ConfirmationCode: code,
            Username: email
        });
    },

    login: async (email, password) => {
        const kp = S.keyPair();
        const init = await H.req('AWSCognitoIdentityProviderService.InitiateAuth', {
            AuthFlow: 'USER_SRP_AUTH',
            AuthParameters: { USERNAME: email, SRP_A: kp.A.toString(16) },
            ClientId: CONFIG.COGNITO.CLIENT_ID,
            ClientMetadata: {}
        });

        const cp = init.ChallengeParameters;
        const salt = BigInt('0x' + cp.SALT);
        const srpB = BigInt('0x' + cp.SRP_B);
        const userId = cp.USER_ID_FOR_SRP || cp.USERNAME;
        const k = S.k();
        const x = S.x(salt, userId, password);
        const u = S.u(kp.A, srpB);
        const sess = S.session(u, x, kp.a, srpB, k);
        const K = S.key(sess, u);
        const { sig, ts } = S.sig(K, cp.SECRET_BLOCK, userId);

        const res = await H.req('AWSCognitoIdentityProviderService.RespondToAuthChallenge', {
            ChallengeName: 'PASSWORD_VERIFIER',
            ChallengeResponses: {
                USERNAME: userId,
                PASSWORD_CLAIM_SECRET_BLOCK: cp.SECRET_BLOCK,
                PASSWORD_CLAIM_SIGNATURE: sig,
                TIMESTAMP: ts
            },
            ClientId: CONFIG.COGNITO.CLIENT_ID,
            ClientMetadata: {}
        });

        const ar = res.AuthenticationResult;
        return ar;
    },

    refreshToken: async (rt) => {
        const data = await H.req('AWSCognitoIdentityProviderService.InitiateAuth', {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: { REFRESH_TOKEN: rt },
            ClientId: CONFIG.COGNITO.CLIENT_ID,
            ClientMetadata: {}
        });
        const ar = data.AuthenticationResult;
        return { AccessToken: ar.AccessToken, IdToken: ar.IdToken, ExpiresIn: ar.ExpiresIn, TokenType: ar.TokenType, RefreshToken: rt };
    },

    profile: async (idToken) => {
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());
        const raw = await H.gql(idToken, 'android_CurrentUserDetailsQuery',
            `query android_CurrentUserDetailsQuery($cognitoId: String!) {
                userFeatureAccess { hasLegacyPremiumFeatures canManageSubscription }
                users: user_details(limit: 1, where: { cognitoId: { _eq: $cognitoId } }) {
                    userId user {
                        __typename ...UserFragment blocked suspensionStatus
                        user_details {
                            auth0Email plan paidTokens subscriptionTokens subscriptionGptTokens
                            interests showNsfw interestsRoles interestsRolesOther
                            tokenRenewalDate subscriptionSource planSubscribeFrequency
                            rolloverTokens planSubscribeDate
                        }
                        tos_acceptances(limit: 1, order_by: { acceptedAt: desc }) { tosHash acceptedAt }
                    }
                }
            } fragment UserFragment on users { id username }`,
            { cognitoId: payload.sub }
        );
        const res = raw.data || raw;
        if (!res.users || !res.users.length) return null;
        const u = res.users[0];
        const ud = u.user.user_details[0];
        return {
            userId: u.userId,
            username: u.user.username,
            email: ud.auth0Email,
            blocked: u.user.blocked,
            suspension: u.user.suspensionStatus,
            plan: ud.plan,
            tokens: {
                paid: ud.paidTokens,
                subscription: ud.subscriptionTokens,
                gpt: ud.subscriptionGptTokens,
                rollover: ud.rolloverTokens,
                total: ud.paidTokens + ud.subscriptionTokens
            },
            subscription: {
                source: ud.subscriptionSource,
                frequency: ud.planSubscribeFrequency,
                subscribeDate: ud.planSubscribeDate,
                renewalDate: ud.tokenRenewalDate
            },
            featureAccess: res.userFeatureAccess
        };
    },

    blueprint: {
        categories: async (idToken) => {
            const raw = await H.gql(idToken, 'android_GetBlueprintCategories',
                `query android_GetBlueprintCategories { blueprintCategories { totalCount edges { node { name handle description } } } }`
            );
            const res = raw.data || raw;
            return res.blueprintCategories;
        },

        list: async (idToken, category, first = 50) => {
            const where = { platforms: ['Android'] };
            if (category) where.categories = [category];
            const raw = await H.gql(idToken, 'android_GetBlueprints',
                `query android_GetBlueprints($after: String, $first: Int, $orderBy: BlueprintOrderByInput, $where: BlueprintFilterInput) { blueprints(after: $after, first: $first, orderBy: $orderBy, where: $where) { edges { node { __typename ...BlueprintGenerationFragment } cursor } pageInfo { hasNextPage endCursor } } } fragment BlueprintThumbnailFragment on BlueprintThumbnail { url name } fragment BlueprintGenerationFragment on Blueprint { name akUUID description accessTier { name } thumbnails { __typename ...BlueprintThumbnailFragment } categories { name } user { id username } }`,
                { first, where }
            );
            const res = raw.data || raw;
            return res.blueprints;
        },

        detail: async (idToken, akUUID) => {
            const raw = await H.gql(idToken, 'android_GetBlueprintById',
                `query android_GetBlueprintById($akUUID: ID!, $blueprintVersionFilterInput: BlueprintVersionsFilterInput!) { blueprint(akUUID: $akUUID) { __typename ...BlueprintGenerationFragment versions(first: 1, where: $blueprintVersionFilterInput) { edges { node { akUUID cost uiMetadata } } } } } fragment BlueprintThumbnailFragment on BlueprintThumbnail { url name } fragment BlueprintGenerationFragment on Blueprint { name akUUID description accessTier { name } thumbnails { __typename ...BlueprintThumbnailFragment } categories { name } user { id username } }`,
                { akUUID, blueprintVersionFilterInput: { uiMetadataSchemaVersion: { gte: 21.0, lte: 25.0 } } }
            );
            const res = raw.data || raw;
            return res.blueprint;
        }
    },

    model: {
        _cache: {},

        _fetchRelease: async (idToken) => {
            if (leonardo.model._cache.release) return leonardo.model._cache.release;
            const raw = await H.gql(idToken, 'android_GetRelease',
                `query android_GetRelease($version: String!) { release(id: $version) { id status createdAt releasedAt schemaReferences(schemaIds: ["https://leonardo.ai/platform/requests/generate/meta"], recursive: true) { schemaId schemaData } } }`,
                { version: 'latest' }
            );
            const res = raw.data || raw;
            const refs = res.release.schemaReferences;
            const meta = refs.find(r => r.schemaId === 'https://leonardo.ai/platform/requests/generate/meta');
            const modelSchemas = meta.schemaData.properties.request.oneOf;

            const findModifiers = (obj, path = '') => {
                if (!obj || typeof obj !== 'object') return [];
                let results = [];
                for (const [k, v] of Object.entries(obj)) {
                    const curPath = path ? path + '.' + k : k;
                    if (k === 'leo:cost_modifier') results.push({ path: curPath, value: v });
                    if (typeof v === 'object' && v !== null) results = results.concat(findModifiers(v, curPath));
                }
                return results;
            };

            const extractAllOfConditions = (allOf) => {
                if (!allOf || !Array.isArray(allOf)) return {};
                const conditions = {};
                for (let i = 0; i < allOf.length; i++) {
                    const entry = allOf[i];
                    const cond = entry.if;
                    if (!cond) continue;
                    const dims = [];
                    if (cond.anyOf) {
                        for (const a of cond.anyOf) {
                            const w = a.properties?.width?.const;
                            const h = a.properties?.height?.const;
                            if (w != null && h != null) dims.push([w, h]);
                            const m = a.properties?.mode?.const;
                            if (m) dims.push({ mode: m });
                        }
                    } else if (cond.properties) {
                        const w = cond.properties.width?.const;
                        const h = cond.properties.height?.const;
                        if (w != null && h != null) dims.push([w, h]);
                        const m = cond.properties.mode?.const;
                        if (m) dims.push({ mode: m });
                    }
                    if (dims.length) conditions[i] = dims;
                }
                return conditions;
            };

            const models = [];
            for (const ref of modelSchemas) {
                const schema = refs.find(r => r.schemaId === ref.$ref);
                if (!schema?.schemaData?.properties?.model) continue;
                const model = schema.schemaData.properties.model;
                const meta = model['ui:metadata'] || {};
                const config = model['leo:model_config'] || {};
                const cost = model['leo:cost_config'] || {};
                const rawMods = findModifiers(schema.schemaData);
                const modifiers = {};
                for (const m of rawMods) {
                    const shortPath = m.path.replace(/^properties\.parameters\./, '');
                    modifiers[shortPath] = m.value;
                }
                const allOfConditions = extractAllOfConditions(schema.schemaData.properties?.parameters?.allOf);
                models.push({
                    id: model.const,
                    name: config.name || schema.schemaData.title,
                    type: config.type || 'unknown',
                    order: meta.order ?? 999,
                    isNew: meta.is_new || false,
                    isFeatured: meta.is_featured || false,
                    description: meta.description || '',
                    detailedDescription: meta.detailed_description || '',
                    thumbnail: meta.thumbnail_url || '',
                    logo: meta.badge?.image_url || '',
                    tags: (meta.tags || []).map(t => ({ label: t.label, value: t.value })),
                    limitless: config.capabilities?.limitless || false,
                    capabilities: config.capabilities || {},
                    cost: {
                        tokens: cost.tokens?.amount || 0,
                        apiCredits: cost.apiCredits?.amount || 0,
                        tokensType: cost.tokens?.type || 'fixed',
                        tokensConfig: cost.tokens || {},
                        apiCreditsConfig: cost.apiCredits || {},
                        modifiers,
                        allOfConditions
                    }
                });
            }
            models.sort((a, b) => a.order - b.order);
            leonardo.model._cache.release = models;
            return models;
        },

        _fetchPresets: async (idToken) => {
            if (leonardo.model._cache.presets) return leonardo.model._cache.presets;
            const raw = await H.gql(idToken, 'android_GetPresets',
                `query android_GetPresets($where: preset_bool_exp, $order_by: [preset_order_by!]) { preset(where: $where, order_by: $order_by) { akUUID name modelId isPaid: isPremium isPublic ownerType thumbnailURL payload } }`,
                { where: { isPublic: { _eq: true }, ownerType: { _eq: 'LEONARDO' }, payload: { _is_null: false } }, order_by: [{ name: 'asc' }] }
            );
            const res = raw.data ?? raw;
            const presets = res?.preset ?? [];
            leonardo.model._cache.presets = presets;
            return presets;
        },

        categories: async (idToken, type = 'image') => {
            return MODEL_CATEGORIES[type] || MODEL_CATEGORIES.image;
        },

        list: async (idToken, type = 'image') => {
            const models = await leonardo.model._fetchRelease(idToken);
            return models.filter(m => m.type === type);
        },

        listByCategory: async (idToken, categoryId, type = 'image') => {
            if (type === 'video') {
                const models = await leonardo.model._fetchRelease(idToken);
                const filtered = models.filter(m => m.type === 'video');
                if (categoryId === 'all') return filtered;
                const set = VIDEO_MODEL_SETS[categoryId] || [];
                return filtered.filter(m => set.includes(m.id));
            }

            // Image: categorize by preset modelId (APK maps preset modelId → categories)
            const presets = await leonardo.model._fetchPresets(idToken);
            if (categoryId === 'all') return presets;
            return presets.filter(p => {
                const cats = PRESET_CATEGORIES[p.modelId] || ['all'];
                return cats.includes(categoryId);
            });
        },

        detail: async (idToken, modelId) => {
            const models = await leonardo.model._fetchRelease(idToken);
            return models.find(m => m.id === modelId) || null;
        }
    },

    generate: {
        styles: async (idToken) => {
            const raw = await H.gql(idToken, 'android_GetStyles',
                `query android_GetStyles($where: style_bool_exp, $limit: Int, $offset: Int, $order_by: [style_order_by!]) { style(where: $where, limit: $limit, offset: $offset, order_by: $order_by) { id isPublic description creatorUserId createdAt akUUID name ownerType teamId } }`,
                { where: { isPublic: { _eq: true } }, order_by: [{ name: 'asc' }] }
            );
            const res = raw.data ?? raw;
            return res?.style ?? [];
        },

        create: async (idToken, { model, prompt, styleIds = [], mode = 'FAST', enhance = 'AUTO', quantity = 1, width = 1024, height = 1024, isPublic = true, duration }) => {
            const params = {
                style_ids: styleIds,
                prompt,
                mode,
                prompt_enhance: enhance,
                quantity,
                width,
                height
            };
            if (duration !== undefined) params.duration = duration;

            const raw = await H.gql(idToken, 'android_GenerateMutation',
                `mutation android_GenerateMutation($request: CreateGenerationRequest!) { generate(request: $request) { generationId apiCreditCost } }`,
                {
                    request: {
                        model,
                        parameters: params,
                        public: isPublic
                    }
                }
            );
            if (raw.errors) throw new Error(raw.errors[0]?.message || 'Generate failed');
            const res = raw.data ?? raw;
            return res?.generate;
        },

        status: async (idToken, generationId) => {
            const raw = await H.gql(idToken, 'android_GenerationsStatusQuery',
                `query android_GenerationsStatusQuery($where: generations_bool_exp = {}) { generations(where: $where) { id status } }`,
                {
                    where: {
                        id: { _in: Array.isArray(generationId) ? generationId : [generationId] },
                        status: { _in: ['COMPLETE', 'FAILED'] }
                    }
                }
            );
            const res = raw.data ?? raw;
            return res?.generations ?? [];
        },

        result: async (idToken, opts = {}) => {
            let userId = opts.userId;
            if (!userId) {
                const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());
                const raw = await H.gql(idToken, 'android_CurrentUserDetailsQuery',
                    `query android_CurrentUserDetailsQuery($cognitoId: String!) { users: user_details(limit: 1, where: { cognitoId: { _eq: $cognitoId } }) { userId } }`,
                    { cognitoId: payload.sub }
                );
                const res = raw.data ?? raw;
                userId = res?.users?.[0]?.userId;
                if (!userId) throw new Error('Could not resolve userId from token');
            }
            const limit = opts.limit || 8;
            const raw = await H.gql(idToken, 'android_UserGenerationsQuery',
                `query android_UserGenerationsQuery($limit: Int, $userId: uuid!) { generations(limit: $limit, where: { userId: { _eq: $userId } }, order_by: [{ createdAt: desc }]) { id prompt status createdAt images: generated_images { id url finalWidth: image_width finalHeight: image_height nsfw public motionMP4URL } } }`,
                { limit, userId }
            );
            const res = raw.data ?? raw;
            return res?.generations ?? [];
        },

        poll: async (idToken, generationId, { interval = 3000, timeout = 60000 } = {}) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const statuses = await leonardo.generate.status(idToken, generationId);
                if (statuses.length > 0) {
                    return statuses[0];
                }
                await new Promise(r => setTimeout(r, interval));
            }
            return { id: generationId, status: 'TIMEOUT' };
        }
    },

    estimateCost: {
        _applyRounding: (value, rounding) => {
            if (!rounding) return Math.round(value);
            const method = rounding.method || 'round';
            const precision = rounding.precision ?? 0;
            const factor = Math.pow(10, precision);
            if (method === 'ceil') return Math.ceil(value * factor) / factor;
            if (method === 'floor') return Math.floor(value * factor) / factor;
            return Math.round(value * factor) / factor;
        },

        // Known video dimension tiers for cost calculation
        _VIDEO_DIM_TIERS: [
            { dims: [[864,496],[640,640],[496,864],[992,432],[752,560],[560,752]], factor: 428544 },
            { dims: [[1280,720],[960,960],[720,1280],[1470,630],[1112,834],[834,1112]], factor: 921600 },
            { dims: [[1920,1080],[1440,1440],[1080,1920],[2520,1080],[1440,1080],[1080,1440]], factor: 2073600 },
            { dims: [[5040,2160],[3840,2160],[2880,2160],[2880,2880],[2160,2880],[2160,3840]], factor: 5802667 }
        ],

        // Get the pixel count factor for given dimensions
        _getVideoDimFactor: (width, height) => {
            for (const tier of leonardo.estimateCost._VIDEO_DIM_TIERS) {
                if (tier.dims.some(([w, h]) => w === width && h === height)) {
                    return tier.factor;
                }
            }
            return null;
        },

        calculate: (costConfig, { width = 1024, height = 1024, quantity = 1, mode, quality, style, content, character, duration } = {}) => {
            if (!costConfig || !costConfig.tokens) return null;
            const tc = costConfig.tokensConfig;
            const type = tc.type || costConfig.tokensType || 'fixed';
            const amount = tc.amount ?? costConfig.tokens ?? 0;
            const qf = tc.quantityFactor ?? 1;

            let cost;
            if (type === 'fixed') {
                cost = amount;
            } else {
                cost = amount * width * height * Math.pow(quantity, qf) / 1_000_000;
            }

            const mods = costConfig.modifiers || {};
            const dimFactor = leonardo.estimateCost._getVideoDimFactor(width, height);

            for (const [path, modObj] of Object.entries(mods)) {
                const m = modObj.default || modObj;
                if (!m || !m.type) continue;

                let applicable = false;

                if (path.includes('video_reference_base')) {
                    continue;
                } else if (m.type === 'multiply' && m.bySelf) {
                    if (path.includes('width') && !path.includes('oneOf')) applicable = true;
                    else if (path.includes('height') && !path.includes('oneOf')) applicable = true;
                    else if (path.includes('duration') && !path.includes('oneOf')) applicable = !!duration;
                    else if (path.includes('quantity')) applicable = quantity > 1;
                } else if (path.includes('allOf') && path.includes('then') && path.includes('width') && m.type === 'multiply' && m.factor) {
                    const allOfMatch = path.match(/allOf\.(\d+)/);
                    if (allOfMatch && costConfig.allOfConditions) {
                        const dims = costConfig.allOfConditions[parseInt(allOfMatch[1])];
                        if (dims) {
                            applicable = dims.some(d => {
                                if (Array.isArray(d)) return d[0] === width && d[1] === height;
                                if (d.mode) return d.mode === mode;
                                return false;
                            });
                        }
                    }
                } else if (path.includes('allOf') && path.includes('then') && path.includes('width') && m.type === 'add') {
                    const highResDims = [[1920,1080],[1080,1920],[1080,1080]];
                    if (highResDims.some(([w,h]) => w === width && h === height) || mode === 'RESOLUTION_1080') {
                        applicable = true;
                    }
                } else if (path.includes('duration') && path.includes('oneOf') && m.type === 'add') {
                    if (duration === 10) applicable = true;
                } else if (path.includes('mode.oneOf.1') && mode === 'QUALITY') applicable = true;
                else if (path.includes('mode.anyOf.1') && mode === 'QUALITY') applicable = true;
                else if (path.includes('mode.anyOf.2') && mode === 'ULTRA') applicable = true;
                else if ((path.includes('/style') || path.includes('.style.')) && style) applicable = true;
                else if ((path.includes('/content') || path.includes('.content.')) && content) applicable = true;
                else if ((path.includes('/character') || path.includes('.character.')) && character) applicable = true;
                else if ((path.includes('/quality') || path.includes('.quality.')) && quality) applicable = true;
                else if ((path.includes('/quantity') || path.includes('.quantity')) && quantity > 1) applicable = true;
                else if ((path.includes('/width') || path.includes('.width')) && !path.includes('.then') && !path.includes('.else')) applicable = true;

                if (!applicable) continue;

                if (m.type === 'multiply') {
                    if (m.bySelf) {
                        if (path.includes('width')) cost *= width;
                        else if (path.includes('height')) cost *= height;
                        else if (path.includes('duration')) cost *= (duration || quantity);
                        else cost *= quantity;
                    } else if (m.factor) {
                        cost *= m.factor;
                    }
                    if (m.minimum != null && cost < m.minimum) cost = m.minimum;
                    if (m.rounding) cost = leonardo.estimateCost._applyRounding(cost, m.rounding);
                } else if (m.type === 'add') {
                    let addAmount = m.amount || 0;
                    cost += addAmount;
                } else if (m.type === 'add_per_megapixel') {
                    const mp = (width * height) / 1_000_000;
                    cost += (m.amount || 0) * mp;
                    cost = leonardo.estimateCost._applyRounding(cost, m.rounding);
                }
            }

            cost = leonardo.estimateCost._applyRounding(cost, tc.rounding);
            if (tc.minimum != null && cost < tc.minimum) cost = tc.minimum;
            if (tc.baseMinimum != null && cost < tc.baseMinimum) cost = tc.baseMinimum;

            return Math.round(cost);
        },

        forModel: async (idToken, modelId, opts = {}) => {
            const models = await leonardo.model._fetchRelease(idToken);
            const model = models.find(m => m.id === modelId);
            if (!model) return null;
            return leonardo.estimateCost.calculate(model.cost, opts);
        }
    }
};
