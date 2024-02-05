import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { NatGatewayStrategy, SubnetType } from "@pulumi/awsx/ec2";
import * as eks from "@pulumi/eks";

const name = 'jconnell-eks' // replace this with your name!
const clusName = `${name}-cluster`
const clusterTag = `kubernetes.io/cluster/${clusName}`

// this defines a valid VPC that can be used for EKS
const vpc = new awsx.ec2.Vpc(`vpc-${name}`, {
    cidrBlock: "172.44.0.0/16",
    natGateways: {
        strategy: NatGatewayStrategy.Single,
    },
    subnetSpecs: [
        {
            type: SubnetType.Private,
            tags: {
                [clusterTag]: "owned",
                "kubernetes.io/role/internal-elb": "1",
            }
        },
        {
            type: SubnetType.Public,
            tags: {
                [clusterTag]: "owned",
                "kubernetes.io/role/elb": "1",
            }
        }],
    tags: {
        Name: `${name}-vpc`,
    }
});


const cluster = new eks.Cluster(name, {
    name: clusName,
    vpcId: vpc.vpcId,
    privateSubnetIds: vpc.privateSubnetIds,
    publicSubnetIds: vpc.publicSubnetIds,
    instanceType: "t2.medium",
    desiredCapacity: 2,
    minSize: 1,
    maxSize: 2,
    createOidcProvider: true,
});

export const kubeconfig = cluster.kubeconfig
export const clusterName = clusName
export const vpcId = vpc.vpcId
export const clusterOidcProvider = cluster.core.oidcProvider?.url
export const clusterOidcProviderArn = cluster.core.oidcProvider?.arn