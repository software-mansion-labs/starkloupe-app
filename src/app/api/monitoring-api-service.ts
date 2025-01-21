'use server';
import { getAccessToken } from '@logto/next/server-actions';
import { logtoClientNextConfig } from '@/app/api/logto-config';
import { Network } from '@/lib/context/settings-context-provider';

export const inviteToOrganization = async (organizationId: string, email: string): Promise<boolean> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/member/invite`, 'POST', {
        email,
    });
    return res.ok;
}

export interface InvitationDetails {
    invitationId: string;
    inviterAvatarSrc: string;
    inviterName: string;
}

export const getInvitationDetailsApi = async (organizationId: string, email: string): Promise<InvitationDetails | undefined> => {
    const res = await unauthorizedCallMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/member/invite?email=${email}`, 'GET');
    if (res.ok) {
        return (await res.json() as any).invitation;
    }
}

export const acceptInvitationApi = async (organizationId: string, invitationId: string): Promise<boolean> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/member/invite/accept`, 'POST', {
        invitationId: invitationId,
    });
    return res.ok
}

export const getOrganizationMembersApi = async (organizationId: string): Promise<{
    members: { name: string, avatarSrc: string, id: string }[],
    invitedEmails: string[]
} | undefined> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/member`, 'GET');
    if (res.ok) {
        return await res.json();
    }
}

export const createMonitoringApiKeyApi = async (network: 'SN_MAIN' | 'SN_SEPOLIA' | 'CUSTOM', organizationId: string, customNetworkId?: string): Promise<string | undefined> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/monitoring/apikey`, 'POST', {
        network: network,
        customNetworkId: customNetworkId,
    });
    if (res.ok) {
        return (await res.json() as any).apiKey;
    }
}

export const createNetworkApi = async (networkName: string, rpcUrl: string, organizationId: string): Promise<boolean> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/network`, 'POST', {
        networkName: networkName.trim(),
        rpcUrl: rpcUrl.trim(),
    });
    return res.ok;
}

export const getNetworksApi = async (organizationId: string): Promise<Network[] | undefined> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/network`, 'GET');
    if (res.ok) {
        return (await res.json() as any).networks;
    }
}

export const deleteNetworkApi = async (networkId: string, organizationId: string): Promise<{ succeed: boolean, responseCode?: number }> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/network/${networkId}`, 'DELETE');
    return res.ok ? { succeed: true } : { succeed: false, responseCode: res.status };
}

interface ApiKeyData {
    apiKey: string;
    network: 'SN_MAIN' | 'SN_SEPOLIA' | 'CUSTOM';
    customNetworkId?: string;
}

export const getMonitoringApiKey = async (organizationId: string): Promise<ApiKeyData | undefined> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization/${organizationId}/monitoring/apikey`, 'GET');
    if (res.ok) {
        return (await res.json() as ApiKeyData);
    }
}

export const createOrganizationApi = async (): Promise<string | undefined> => {
    const res = await callMonitoringApi(`${process.env.WALNUT_MAIN_API_URL}/organization`, 'POST');
    if (res.ok) {
        return (await res.json() as { organizationId: string }).organizationId;
    }
};

const callMonitoringApi = async (url: string, method: string, body?: any) => {
    if (process.env.TEST_USER) {
        console.log(`Using TEST_USER authorization for calling backend URL: ${url}`);
        return await fetch(url, {
            method: method,
            headers: {
                // Custom header - backend will check this, must match TEST_USER env variable
                'use-testuser': 'Testuser',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } else {
        const accessToken = await getAccessToken(logtoClientNextConfig, process.env.WALNUT_MAIN_API_URL);
        return await fetch(url, {
            method: method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    }
}

const unauthorizedCallMonitoringApi = async (url: string, method: string, body?: any) => {
    return await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
}