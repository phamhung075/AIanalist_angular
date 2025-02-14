// app-tree.component.ts (Parent component)
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TreeComponent } from '@ui/shared/components/branch-display/branch-display.component';
import { mockTreeData } from '@ui/shared/components/branch-display/mock-data';
import { TreeNode } from '@ui/shared/models/tree-node.model';
import { TreeService } from 'src/app/services/tree/tree.service';

@Component({
	selector: 'app-tree-container',
	standalone: true,
	imports: [TreeComponent, CommonModule],
	template: `
		<div class="container">
			<h1>Tree Structure</h1>
			<div *ngIf="treeData">
				<app-tree
					[node]="treeData"
					[dropListIds]="dropListIds"
					(registerDropList)="onRegisterDropList($event)"
				></app-tree>
			</div>
			<div *ngIf="!treeData">No tree data available</div>
		</div>
		<pre>{{ treeData | json }}</pre>
	`,
	styles: [
		`
			.container {
				padding: 20px;
				max-width: 800px;
				margin: 0 auto;
			}
			h1 {
				color: #333;
				margin-bottom: 20px;
			}
		`,
	],
})
export class AppTreeContainer implements OnInit {
	treeData: TreeNode = mockTreeData;
	dropListIds: string[] = [];
	constructor(private treeService: TreeService) {}

	ngOnInit() {
		// Register all nodes in the tree with the service
		this.registerNodesRecursively(this.treeData);
		console.log('Tree Container Initialized');
	}

	private registerNodesRecursively(node: TreeNode, parentId?: string) {
		// Register the current node
		this.treeService.updateNodeMaps(node, parentId);
		console.log('Registered node:', { nodeId: node.id, parentId });

		// Register all children
		node.children.forEach((child) => {
			this.registerNodesRecursively(child, node.id);
		});
	}

	onRegisterDropList(id: string) {
		if (!this.dropListIds.includes(id)) {
			this.dropListIds = [...this.dropListIds, id];
		}
	}
}
