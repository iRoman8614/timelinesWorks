const projectGps =
    // {
    //     "id": "c1361f7a-5e25-4045-9069-6c20c2e7161b",
    //     "name": "проект ГПС",
    //     "description": "Тестовый проект для отладки оптимизатора",
    //     "assemblyTypes": [
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440001",
    //             "name": "ГПА-Тип-1",
    //             "description": "Газоперекачивающий агрегат типа 1",
    //             "components": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440010",
    //                     "name": "Основной двигатель",
    //                     "componentTypeId": "550e8400-e29b-41d4-a716-446655440100"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440011",
    //                     "name": "Основной компрессор",
    //                     "componentTypeId": "550e8400-e29b-41d4-a716-446655440101"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440012",
    //                     "name": "Воздушный фильтр",
    //                     "componentTypeId": "550e8400-e29b-41d4-a716-446655440102"
    //                 }
    //             ]
    //         },
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440002",
    //             "name": "ГПА-Тип-2",
    //             "description": "Газоперекачивающий агрегат типа 2",
    //             "components": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440013",
    //                     "name": "Основной двигатель",
    //                     "componentTypeId": "550e8400-e29b-41d4-a716-446655440100"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440014",
    //                     "name": "Основной компрессор",
    //                     "componentTypeId": "550e8400-e29b-41d4-a716-446655440101"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440015",
    //                     "name": "Воздушный фильтр",
    //                     "componentTypeId": "550e8400-e29b-41d4-a716-446655440102"
    //                 }
    //             ]
    //         }
    //     ],
    //     "componentTypes": [
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440100",
    //             "name": "Двигатель",
    //             "description": "Газотурбинный двигатель"
    //         },
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440101",
    //             "name": "Компрессор",
    //             "description": "Центробежный компрессор"
    //         },
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440102",
    //             "name": "Фильтр",
    //             "description": "Воздушный фильтр"
    //         }
    //     ],
    //     "partModels": [
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440200",
    //             "name": "Двигатель ГТД-10",
    //             "uid": "ENGINE-GTD-10",
    //             "specification": "ГТД-10 Технические условия ТУ-123",
    //             "componentTypeId": "550e8400-e29b-41d4-a716-446655440100",
    //             "maintenanceTypes": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440300",
    //                     "name": "ТО двигателя",
    //                     "duration": 8,
    //                     "priority": 1,
    //                     "interval": 720,
    //                     "deviation": 30
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440301",
    //                     "name": "Замена фильтров",
    //                     "duration": 2,
    //                     "priority": 2,
    //                     "interval": 180,
    //                     "deviation": 15
    //                 }
    //             ],
    //             "units": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440400",
    //                     "name": "ДВ-001",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440200",
    //                     "serialNumber": "ENG-2023-001",
    //                     "manufactureDate": "2023-01-15"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440401",
    //                     "name": "ДВ-002",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440200",
    //                     "serialNumber": "ENG-2023-002",
    //                     "manufactureDate": "2023-01-20"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440402",
    //                     "name": "ДВ-003",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440200",
    //                     "serialNumber": "ENG-2023-003",
    //                     "manufactureDate": "2023-02-10"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440403",
    //                     "name": "ДВ-004",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440200",
    //                     "serialNumber": "ENG-2023-004",
    //                     "manufactureDate": "2023-02-15"
    //                 }
    //             ]
    //         },
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440201",
    //             "name": "Компрессор ЦК-5",
    //             "uid": "COMPRESSOR-CK-5",
    //             "specification": "ЦК-5 Технические условия ТУ-456",
    //             "componentTypeId": "550e8400-e29b-41d4-a716-446655440101",
    //             "maintenanceTypes": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440302",
    //                     "name": "ТО компрессора",
    //                     "duration": 6,
    //                     "priority": 1,
    //                     "interval": 540,
    //                     "deviation": 20
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440303",
    //                     "name": "Проверка клапанов",
    //                     "duration": 3,
    //                     "priority": 2,
    //                     "interval": 270,
    //                     "deviation": 10
    //                 }
    //             ],
    //             "units": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440404",
    //                     "name": "КОМП-001",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440201",
    //                     "serialNumber": "COMP-2023-001",
    //                     "manufactureDate": "2023-02-01"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440405",
    //                     "name": "КОМП-002",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440201",
    //                     "serialNumber": "COMP-2023-002",
    //                     "manufactureDate": "2023-02-05"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440406",
    //                     "name": "КОМП-003",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440201",
    //                     "serialNumber": "COMP-2023-003",
    //                     "manufactureDate": "2023-02-20"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440407",
    //                     "name": "КОМП-004",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440201",
    //                     "serialNumber": "COMP-2023-004",
    //                     "manufactureDate": "2023-02-25"
    //                 }
    //             ]
    //         },
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440202",
    //             "name": "Фильтр ФВ-100",
    //             "uid": "FILTER-FV-100",
    //             "specification": "ФВ-100 Технические условия ТУ-789",
    //             "componentTypeId": "550e8400-e29b-41d4-a716-446655440102",
    //             "maintenanceTypes": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440304",
    //                     "name": "Замена фильтра",
    //                     "duration": 1,
    //                     "priority": 3,
    //                     "interval": 90,
    //                     "deviation": 5
    //                 }
    //             ],
    //             "units": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440408",
    //                     "name": "ФИЛЬТР-001",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440202",
    //                     "serialNumber": "FILT-2023-001",
    //                     "manufactureDate": "2023-03-01"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440409",
    //                     "name": "ФИЛЬТР-002",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440202",
    //                     "serialNumber": "FILT-2023-002",
    //                     "manufactureDate": "2023-03-05"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440410",
    //                     "name": "ФИЛЬТР-003",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440202",
    //                     "serialNumber": "FILT-2023-003",
    //                     "manufactureDate": "2023-03-10"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440411",
    //                     "name": "ФИЛЬТР-004",
    //                     "partModelId": "550e8400-e29b-41d4-a716-446655440202",
    //                     "serialNumber": "FILT-2023-004",
    //                     "manufactureDate": "2023-03-15"
    //                 }
    //             ]
    //         }
    //     ],
    //     "nodes": [
    //         {
    //             "id": "550e8400-e29b-41d4-a716-446655440500",
    //             "name": "Цех №1",
    //             "description": "Основной цех перекачки",
    //             "type": "NODE",
    //             "children": [
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440600",
    //                     "name": "ГПА-1",
    //                     "type": "ASSEMBLY",
    //                     "assemblyTypeId": "550e8400-e29b-41d4-a716-446655440001"
    //                 },
    //                 {
    //                     "id": "550e8400-e29b-41d4-a716-446655440601",
    //                     "name": "ГПА-2",
    //                     "type": "ASSEMBLY",
    //                     "assemblyTypeId": "550e8400-e29b-41d4-a716-446655440002"
    //                 }
    //             ],
    //             "conditions": [
    //                 {
    //                     "type": "MAX_MAINTENANCE",
    //                     "maxUnderMaintenance": 1
    //                 },
    //                 {
    //                     "type": "REQUIRED_WORKING",
    //                     "requiredWorking": 1
    //                 }
    //             ]
    //         }
    //     ],
    //     "timeline": {
    //         "start": "2025-01-01",
    //         "end": "2025-12-31",
    //         "assemblyStates": [
    //             {
    //                 "assemblyId": "550e8400-e29b-41d4-a716-446655440600",
    //                 "type": "WORKING",
    //                 "dateTime": "2025-01-01T00:00:00"
    //             },
    //             {
    //                 "assemblyId": "550e8400-e29b-41d4-a716-446655440600",
    //                 "type": "IDLE",
    //                 "dateTime": "2025-01-11T00:00:00"
    //             },
    //             {
    //                 "assemblyId": "550e8400-e29b-41d4-a716-446655440600",
    //                 "type": "WORKING",
    //                 "dateTime": "2025-01-19T00:00:00"
    //             },
    //             {
    //                 "assemblyId": "550e8400-e29b-41d4-a716-446655440601",
    //                 "type": "WORKING",
    //                 "dateTime": "2025-01-01T00:00:00"
    //             },
    //             {
    //                 "assemblyId": "550e8400-e29b-41d4-a716-446655440601",
    //                 "type": "IDLE",
    //                 "dateTime": "2025-01-16T00:00:00"
    //             },
    //             {
    //                 "assemblyId": "550e8400-e29b-41d4-a716-446655440601",
    //                 "type": "WORKING",
    //                 "dateTime": "2025-01-22T00:00:00"
    //             }
    //         ],
    //         "unitAssignments": [
    //             {
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440400",
    //                 "custom": true,
    //                 "componentOfAssembly": {
    //                     "assemblyId": "550e8400-e29b-41d4-a716-446655440600",
    //                     "componentPath": [
    //                         "550e8400-e29b-41d4-a716-446655440010"
    //                     ]
    //                 },
    //                 "dateTime": "2025-01-01T00:00:00"
    //             },
    //             {
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "custom": true,
    //                 "componentOfAssembly": {
    //                     "assemblyId": "550e8400-e29b-41d4-a716-446655440600",
    //                     "componentPath": [
    //                         "550e8400-e29b-41d4-a716-446655440010"
    //                     ]
    //                 },
    //                 "dateTime": "2025-07-01T00:00:00"
    //             },
    //             {
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "custom": true,
    //                 "componentOfAssembly": {
    //                     "assemblyId": "550e8400-e29b-41d4-a716-446655440600",
    //                     "componentPath": [
    //                         "550e8400-e29b-41d4-a716-446655440011"
    //                     ]
    //                 },
    //                 "dateTime": "2025-01-01T00:00:00"
    //             },
    //             {
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "custom": true,
    //                 "componentOfAssembly": {
    //                     "assemblyId": "550e8400-e29b-41d4-a716-446655440601",
    //                     "componentPath": [
    //                         "550e8400-e29b-41d4-a716-446655440013"
    //                     ]
    //                 },
    //                 "dateTime": "2025-01-01T00:00:00"
    //             },
    //             {
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440405",
    //                 "custom": true,
    //                 "componentOfAssembly": {
    //                     "assemblyId": "550e8400-e29b-41d4-a716-446655440601",
    //                     "componentPath": [
    //                         "550e8400-e29b-41d4-a716-446655440014"
    //                     ]
    //                 },
    //                 "dateTime": "2025-01-01T00:00:00"
    //             }
    //         ],
    //         "maintenanceEvents": [
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440300",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440400",
    //                 "dateTime": "2025-01-11T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440300",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440400",
    //                 "dateTime": "2025-03-15T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440300",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440400",
    //                 "dateTime": "2025-05-10T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440300",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440400",
    //                 "dateTime": "2025-06-20T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440301",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-08-15T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440301",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-10-20T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440300",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-12-05T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440301",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-02-20T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440301",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-05-25T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440300",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-09-10T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440301",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440401",
    //                 "dateTime": "2025-11-28T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440303",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "dateTime": "2025-02-18T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440302",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "dateTime": "2025-04-20T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440302",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "dateTime": "2025-06-12T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440303",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "dateTime": "2025-08-22T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440303",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "dateTime": "2025-10-18T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440303",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440404",
    //                 "dateTime": "2025-12-10T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440303",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440405",
    //                 "dateTime": "2025-02-28T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440303",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440405",
    //                 "dateTime": "2025-05-22T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440302",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440405",
    //                 "dateTime": "2025-07-15T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440302",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440405",
    //                 "dateTime": "2025-09-20T00:00:00"
    //             },
    //             {
    //                 "maintenanceTypeId": "550e8400-e29b-41d4-a716-446655440302",
    //                 "custom": true,
    //                 "unitId": "550e8400-e29b-41d4-a716-446655440405",
    //                 "dateTime": "2025-11-25T00:00:00"
    //             }
    //         ]
    //     }
    // }
        {
            "id": "c1361f7a-5e25-4045-9069-6c20c2e7161b",
            "name": "проект ГПС",
            "description": "Тестовый проект для отладки оптимизатора",
            "assemblyTypes": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440001",
                    "name": "ГПА-Тип-1",
                    "description": "Газоперекачивающий агрегат типа 1",
                    "components": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440010",
                            "name": "Основной двигатель",
                            "componentTypeId": "550e8400-e29b-41d4-a716-446655440100"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440011",
                            "name": "Основной компрессор",
                            "componentTypeId": "550e8400-e29b-41d4-a716-446655440101"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440012",
                            "name": "Воздушный фильтр",
                            "componentTypeId": "550e8400-e29b-41d4-a716-446655440102"
                        }
                    ]
                },
                {
                    "id": "550e8400-e29b-41d4-a716-446655440002",
                    "name": "ГПА-Тип-2",
                    "description": "Газоперекачивающий агрегат типа 2",
                    "components": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440013",
                            "name": "Основной двигатель",
                            "componentTypeId": "550e8400-e29b-41d4-a716-446655440100"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440014",
                            "name": "Основной компрессор",
                            "componentTypeId": "550e8400-e29b-41d4-a716-446655440101"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440015",
                            "name": "Воздушный фильтр",
                            "componentTypeId": "550e8400-e29b-41d4-a716-446655440102"
                        }
                    ]
                }
            ],
            "componentTypes": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440100",
                    "name": "Двигатель",
                    "description": "Газотурбинный двигатель"
                },
                {
                    "id": "550e8400-e29b-41d4-a716-446655440101",
                    "name": "Компрессор",
                    "description": "Центробежный компрессор"
                },
                {
                    "id": "550e8400-e29b-41d4-a716-446655440102",
                    "name": "Фильтр",
                    "description": "Воздушный фильтр"
                }
            ],
            "partModels": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440200",
                    "name": "Двигатель ГТД-10",
                    "uid": "ENGINE-GTD-10",
                    "specification": "ГТД-10 Технические условия ТУ-123",
                    "componentTypeId": "550e8400-e29b-41d4-a716-446655440100",
                    "maintenanceTypes": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440300",
                            "name": "ТО двигателя",
                            "duration": 8,
                            "priority": 1,
                            "interval": 720,
                            "deviation": 30
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440301",
                            "name": "Замена фильтров",
                            "duration": 2,
                            "priority": 2,
                            "interval": 180,
                            "deviation": 15
                        }
                    ],
                    "units": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440400",
                            "name": "ДВ-001",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440200",
                            "serialNumber": "ENG-2023-001",
                            "manufactureDate": "2023-01-15"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440401",
                            "name": "ДВ-002",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440200",
                            "serialNumber": "ENG-2023-002",
                            "manufactureDate": "2023-01-20"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440402",
                            "name": "ДВ-003",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440200",
                            "serialNumber": "ENG-2023-003",
                            "manufactureDate": "2023-02-10"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440403",
                            "name": "ДВ-004",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440200",
                            "serialNumber": "ENG-2023-004",
                            "manufactureDate": "2023-02-15"
                        }
                    ]
                },
                {
                    "id": "550e8400-e29b-41d4-a716-446655440201",
                    "name": "Компрессор ЦК-5",
                    "uid": "COMPRESSOR-CK-5",
                    "specification": "ЦК-5 Технические условия ТУ-456",
                    "componentTypeId": "550e8400-e29b-41d4-a716-446655440101",
                    "maintenanceTypes": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440302",
                            "name": "ТО компрессора",
                            "duration": 6,
                            "priority": 1,
                            "interval": 540,
                            "deviation": 20
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440303",
                            "name": "Проверка клапанов",
                            "duration": 3,
                            "priority": 2,
                            "interval": 270,
                            "deviation": 10
                        }
                    ],
                    "units": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440404",
                            "name": "КОМП-001",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440201",
                            "serialNumber": "COMP-2023-001",
                            "manufactureDate": "2023-02-01"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440405",
                            "name": "КОМП-002",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440201",
                            "serialNumber": "COMP-2023-002",
                            "manufactureDate": "2023-02-05"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440406",
                            "name": "КОМП-003",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440201",
                            "serialNumber": "COMP-2023-003",
                            "manufactureDate": "2023-02-20"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440407",
                            "name": "КОМП-004",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440201",
                            "serialNumber": "COMP-2023-004",
                            "manufactureDate": "2023-02-25"
                        }
                    ]
                },
                {
                    "id": "550e8400-e29b-41d4-a716-446655440202",
                    "name": "Фильтр ФВ-100",
                    "uid": "FILTER-FV-100",
                    "specification": "ФВ-100 Технические условия ТУ-789",
                    "componentTypeId": "550e8400-e29b-41d4-a716-446655440102",
                    "maintenanceTypes": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440304",
                            "name": "Замена фильтра",
                            "duration": 1,
                            "priority": 3,
                            "interval": 90,
                            "deviation": 5
                        }
                    ],
                    "units": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440408",
                            "name": "ФИЛЬТР-001",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440202",
                            "serialNumber": "FILT-2023-001",
                            "manufactureDate": "2023-03-01"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440409",
                            "name": "ФИЛЬТР-002",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440202",
                            "serialNumber": "FILT-2023-002",
                            "manufactureDate": "2023-03-05"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440410",
                            "name": "ФИЛЬТР-003",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440202",
                            "serialNumber": "FILT-2023-003",
                            "manufactureDate": "2023-03-10"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440411",
                            "name": "ФИЛЬТР-004",
                            "partModelId": "550e8400-e29b-41d4-a716-446655440202",
                            "serialNumber": "FILT-2023-004",
                            "manufactureDate": "2023-03-15"
                        }
                    ]
                }
            ],
            "nodes": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440500",
                    "name": "Цех №1",
                    "description": "Основной цех перекачки",
                    "type": "NODE",
                    "children": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440600",
                            "name": "ГПА-1",
                            "type": "ASSEMBLY",
                            "assemblyTypeId": "550e8400-e29b-41d4-a716-446655440001"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440601",
                            "name": "ГПА-2",
                            "type": "ASSEMBLY",
                            "assemblyTypeId": "550e8400-e29b-41d4-a716-446655440002"
                        }
                    ],
                    "conditions": [
                        {
                            "type": "MAX_MAINTENANCE",
                            "maxUnderMaintenance": 1
                        },
                        {
                            "type": "REQUIRED_WORKING",
                            "requiredWorking": 1
                        }
                    ]
                }
            ],
            "timeline": {
                "start": "2025-01-01",
                "end": "2025-12-31",
                "assemblyStates": [],
                "unitAssignments": [],
                "maintenanceEvents": []
            }
        }
    ;


export const mockProjects = [projectGps];

export const mockStructureTree = {
    rootItems: [
        {
            key: projectGps.id,
            type: 'project',
            title: projectGps.name,
            description: projectGps.description
        }
    ]
};