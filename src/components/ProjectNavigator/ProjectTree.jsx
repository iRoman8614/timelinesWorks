import React from 'react';
import { Tree } from 'antd';
import { FolderOutlined, FolderOpenOutlined, ProjectOutlined } from '@ant-design/icons';
import './ProjectTree.css';

const ProjectTree = ({ data, onSelectProject }) => {
    const convertToTreeData = (items) => {
        return items.map(item => {
            const treeNode = {
                key: item.key,
                title: item.title,
                icon: item.type === 'folder'
                    ? ({ expanded }) => expanded ? <FolderOpenOutlined /> : <FolderOutlined />
                    : <ProjectOutlined />,
                isLeaf: item.type === 'project',
                type: item.type,
                description: item.description
            };

            if (item.children && item.children.length > 0) {
                treeNode.children = convertToTreeData(item.children);
            }

            return treeNode;
        });
    };

    const treeData = convertToTreeData(data.rootItems);

    const handleSelect = (selectedKeys, info) => {
        // Вызываем callback только если выбран проект (не папка)
        if (info.node.type === 'project') {
            onSelectProject(info.node.key);
        }
    };

    return (
        <div className="project-tree">
            <Tree
                showIcon
                defaultExpandAll
                treeData={treeData}
                onSelect={handleSelect}
                className="project-tree-content"
            />
        </div>
    );
};

export default ProjectTree;