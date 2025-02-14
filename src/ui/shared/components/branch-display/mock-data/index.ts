import { TreeNode } from '@ui/shared/models/tree-node.model';

export const mockTreeData: TreeNode = {
	id: '1',
	value: 'Root',
	children: [
		{
			id: '2',
			value: 'Branch 1',
			children: [
				{
					id: '4',
					value: 'Sub Branch 1.1',
					children: [],
				},
			],
		},
		{
			id: '3',
			value: 'Branch 2',
			children: [],
		},
	],
};
