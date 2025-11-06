// Моковые данные для демо-версии на основе структуры из ТО_Структура_данных_2.txt

export const mockStructureTree = {
    rootItems: [
        {
            key: 'folder-1',
            type: 'folder',
            title: 'Производство',
            children: [
                {
                    key: 'project-gps',
                    type: 'project',
                    title: 'Тестовый проект ГПС',
                    description: 'Тестовый проект для отладки оптимизатора'
                },
                {
                    key: 'project-b',
                    type: 'project',
                    title: 'Проект Б',
                    description: 'Вспомогательное оборудование'
                }
            ]
        },
        {
            key: 'folder-2',
            type: 'folder',
            title: 'Склад',
            children: [
                {
                    key: 'project-warehouse',
                    type: 'project',
                    title: 'Проект Склад-1',
                    description: 'Складское оборудование'
                }
            ]
        }
    ]
};

// Детальные данные проектов
export const mockProjects = {
    'project-gps': {
        id: 'project-gps',
        name: 'Тестовый проект ГПС',
        description: 'Тестовый проект для отладки оптимизатора',
        assemblyTypes: [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'ГПА-Тип-1',
                description: 'Газоперекачивающий агрегат типа 1',
                components: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440010',
                        name: 'Основной двигатель',
                        componentTypeId: '550e8400-e29b-41d4-a716-446655440100'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440011',
                        name: 'Основной компрессор',
                        componentTypeId: '550e8400-e29b-41d4-a716-446655440101'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440012',
                        name: 'Воздушный фильтр',
                        componentTypeId: '550e8400-e29b-41d4-a716-446655440102'
                    }
                ]
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'ГПА-Тип-2',
                description: 'Газоперекачивающий агрегат типа 2',
                components: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440013',
                        name: 'Основной двигатель',
                        componentTypeId: '550e8400-e29b-41d4-a716-446655440100'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440014',
                        name: 'Основной компрессор',
                        componentTypeId: '550e8400-e29b-41d4-a716-446655440101'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440015',
                        name: 'Воздушный фильтр',
                        componentTypeId: '550e8400-e29b-41d4-a716-446655440102'
                    }
                ]
            }
        ],
        componentTypes: [
            {
                id: '550e8400-e29b-41d4-a716-446655440100',
                name: 'Двигатель',
                description: 'Газотурбинный двигатель'
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440101',
                name: 'Компрессор',
                description: 'Центробежный компрессор'
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440102',
                name: 'Фильтр',
                description: 'Воздушный фильтр'
            }
        ],
        partModels: [
            {
                id: '550e8400-e29b-41d4-a716-446655440200',
                name: 'Двигатель ГТД-10',
                uid: 'ENGINE-GTD-10',
                specification: 'ГТД-10 Технические условия ТУ-123',
                maintenanceTypes: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440300',
                        name: 'ТО двигателя',
                        duration: 8,
                        priority: 1,
                        interval: 720,
                        deviation: 30
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440301',
                        name: 'Замена фильтров',
                        duration: 2,
                        priority: 2,
                        interval: 180,
                        deviation: 15
                    }
                ],
                units: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440400',
                        name: 'ДВ-001',
                        serialNumber: 'ENG-2023-001',
                        manufactureDate: '2023-01-15'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440401',
                        name: 'ДВ-002',
                        serialNumber: 'ENG-2023-002',
                        manufactureDate: '2023-01-20'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440402',
                        name: 'ДВ-003',
                        serialNumber: 'ENG-2023-003',
                        manufactureDate: '2023-02-10'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440403',
                        name: 'ДВ-004',
                        serialNumber: 'ENG-2023-004',
                        manufactureDate: '2023-02-15'
                    }
                ]
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440201',
                name: 'Компрессор ЦК-5',
                uid: 'COMPRESSOR-CK-5',
                specification: 'ЦК-5 Технические условия ТУ-456',
                maintenanceTypes: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440302',
                        name: 'ТО компрессора',
                        duration: 6,
                        priority: 1,
                        interval: 540,
                        deviation: 20
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440303',
                        name: 'Проверка клапанов',
                        duration: 3,
                        priority: 2,
                        interval: 270,
                        deviation: 10
                    }
                ],
                units: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440404',
                        name: 'КОМП-001',
                        serialNumber: 'COMP-2023-001',
                        manufactureDate: '2023-02-01'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440405',
                        name: 'КОМП-002',
                        serialNumber: 'COMP-2023-002',
                        manufactureDate: '2023-02-05'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440406',
                        name: 'КОМП-003',
                        serialNumber: 'COMP-2023-003',
                        manufactureDate: '2023-02-20'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440407',
                        name: 'КОМП-004',
                        serialNumber: 'COMP-2023-004',
                        manufactureDate: '2023-02-25'
                    }
                ]
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440202',
                name: 'Фильтр ФВ-100',
                uid: 'FILTER-FV-100',
                specification: 'ФВ-100 Технические условия ТУ-789',
                maintenanceTypes: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440304',
                        name: 'Замена фильтра',
                        duration: 1,
                        priority: 3,
                        interval: 90,
                        deviation: 5
                    }
                ],
                units: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440408',
                        name: 'ФИЛЬТР-001',
                        serialNumber: 'FILT-2023-001',
                        manufactureDate: '2023-03-01'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440409',
                        name: 'ФИЛЬТР-002',
                        serialNumber: 'FILT-2023-002',
                        manufactureDate: '2023-03-05'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440410',
                        name: 'ФИЛЬТР-003',
                        serialNumber: 'FILT-2023-003',
                        manufactureDate: '2023-03-10'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440411',
                        name: 'ФИЛЬТР-004',
                        serialNumber: 'FILT-2023-004',
                        manufactureDate: '2023-03-15'
                    }
                ]
            }
        ],
        nodes: [
            {
                id: '550e8400-e29b-41d4-a716-446655440500',
                name: 'Цех №1',
                description: 'Основной цех перекачки',
                type: 'NODE',
                children: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440600',
                        name: 'ГПА-1',
                        type: 'ASSEMBLY',
                        assemblyTypeId: '550e8400-e29b-41d4-a716-446655440001'
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440601',
                        name: 'ГПА-2',
                        type: 'ASSEMBLY',
                        assemblyTypeId: '550e8400-e29b-41d4-a716-446655440002'
                    }
                ],
                conditions: [
                    {
                        type: 'MAX_MAINTENANCE',
                        maxUnderMaintenance: 1
                    },
                    {
                        type: 'REQUIRED_WORKING',
                        requiredWorking: 1
                    }
                ]
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440501',
                name: 'Цех №2',
                description: 'Резервный цех',
                type: 'NODE',
                children: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440502',
                        name: 'Сектор А',
                        type: 'NODE',
                        children: [
                            {
                                id: '550e8400-e29b-41d4-a716-446655440602',
                                name: 'ГПА-3',
                                type: 'ASSEMBLY',
                                assemblyTypeId: '550e8400-e29b-41d4-a716-446655440001'
                            }
                        ],
                        conditions: [
                            {
                                type: 'MAX_MAINTENANCE',
                                maxUnderMaintenance: 1
                            }
                        ]
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440503',
                        name: 'Сектор Б',
                        type: 'NODE',
                        children: [
                            {
                                id: '550e8400-e29b-41d4-a716-446655440603',
                                name: 'ГПА-4',
                                type: 'ASSEMBLY',
                                assemblyTypeId: '550e8400-e29b-41d4-a716-446655440002'
                            }
                        ],
                        conditions: [
                            {
                                type: 'MAX_MAINTENANCE',
                                maxUnderMaintenance: 1
                            }
                        ]
                    }
                ],
                conditions: [
                    {
                        type: 'MAX_MAINTENANCE',
                        maxUnderMaintenance: 1
                    },
                    {
                        type: 'REQUIRED_WORKING',
                        requiredWorking: 1
                    }
                ]
            }
        ],
        timeline: {
            assemblyStates: [
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440600',
                    type: 'WORKING',
                    dateTime: '2025-01-01T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440600',
                    type: 'IDLE',
                    dateTime: '2025-01-11T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440600',
                    type: 'WORKING',
                    dateTime: '2025-01-19T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440601',
                    type: 'WORKING',
                    dateTime: '2025-01-01T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440601',
                    type: 'IDLE',
                    dateTime: '2025-01-16T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440601',
                    type: 'WORKING',
                    dateTime: '2025-01-22T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440602',
                    type: 'WORKING',
                    dateTime: '2025-01-01T00:00:00'
                },
                {
                    assemblyId: '550e8400-e29b-41d4-a716-446655440603',
                    type: 'WORKING',
                    dateTime: '2025-01-01T00:00:00'
                }
            ],
            unitAssignments: [
                {
                    unitId: '550e8400-e29b-41d4-a716-446655440400',
                    componentOfAssembly: {
                        assemblyId: '550e8400-e29b-41d4-a716-446655440600',
                        componentPath: ['550e8400-e29b-41d4-a716-446655440010']
                    },
                    dateTime: '2025-01-01T00:00:00'
                },
                {
                    unitId: '550e8400-e29b-41d4-a716-446655440401',
                    componentOfAssembly: {
                        assemblyId: '550e8400-e29b-41d4-a716-446655440600',
                        componentPath: ['550e8400-e29b-41d4-a716-446655440010']
                    },
                    dateTime: '2025-07-01T00:00:00'
                },
                {
                    unitId: '550e8400-e29b-41d4-a716-446655440404',
                    componentOfAssembly: {
                        assemblyId: '550e8400-e29b-41d4-a716-446655440600',
                        componentPath: ['550e8400-e29b-41d4-a716-446655440011']
                    },
                    dateTime: '2025-01-01T00:00:00'
                },
                {
                    unitId: '550e8400-e29b-41d4-a716-446655440401',
                    componentOfAssembly: {
                        assemblyId: '550e8400-e29b-41d4-a716-446655440601',
                        componentPath: ['550e8400-e29b-41d4-a716-446655440013']
                    },
                    dateTime: '2025-01-01T00:00:00'
                },
                {
                    unitId: '550e8400-e29b-41d4-a716-446655440405',
                    componentOfAssembly: {
                        assemblyId: '550e8400-e29b-41d4-a716-446655440601',
                        componentPath: ['550e8400-e29b-41d4-a716-446655440014']
                    },
                    dateTime: '2025-01-01T00:00:00'
                }
            ],
            maintenanceEvents: [
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440300',
                    unitId: '550e8400-e29b-41d4-a716-446655440400',
                    dateTime: '2025-01-11T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440301',
                    unitId: '550e8400-e29b-41d4-a716-446655440400',
                    dateTime: '2025-03-15T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440300',
                    unitId: '550e8400-e29b-41d4-a716-446655440400',
                    dateTime: '2025-06-20T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440300',
                    unitId: '550e8400-e29b-41d4-a716-446655440401',
                    dateTime: '2025-08-15T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440301',
                    unitId: '550e8400-e29b-41d4-a716-446655440401',
                    dateTime: '2025-10-20T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440302',
                    unitId: '550e8400-e29b-41d4-a716-446655440405',
                    dateTime: '2025-01-16T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440303',
                    unitId: '550e8400-e29b-41d4-a716-446655440405',
                    dateTime: '2025-04-10T00:00:00'
                },
                {
                    maintenanceTypeId: '550e8400-e29b-41d4-a716-446655440302',
                    unitId: '550e8400-e29b-41d4-a716-446655440405',
                    dateTime: '2025-07-15T00:00:00'
                }
            ]
        }
    },
    'project-b': {
        id: 'project-b',
        name: 'Проект Б',
        description: 'Вспомогательное оборудование',
        assemblyTypes: [],
        componentTypes: [],
        partModels: [],
        nodes: [],
        timeline: {
            assemblyStates: [],
            unitAssignments: [],
            maintenanceEvents: []
        }
    },
    'project-warehouse': {
        id: 'project-warehouse',
        name: 'Проект Склад-1',
        description: 'Складское оборудование',
        assemblyTypes: [],
        componentTypes: [],
        partModels: [],
        nodes: [],
        timeline: {
            assemblyStates: [],
            unitAssignments: [],
            maintenanceEvents: []
        }
    }
};