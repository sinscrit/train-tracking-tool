// Sample dataset for train service tracking
// Represents the data structure for tracking train services across multiple systems

export interface StationTime {
  time: string;
  border_crossing?: boolean; // true if this stop is at a border (shown in dimmer red/italic)
  changed?: boolean; // true if time was changed from original schedule (shown with dark bg and yellow text)
}

export interface JourneySchedule {
  // Outbound: PNO → Wannehain → BRU → Hazeldonk → AMS
  outbound: {
    pno_dep?: StationTime;
    wnh_arr?: StationTime;
    bru_arr?: StationTime;
    bru_dep?: StationTime;
    hdk_arr?: StationTime;
    ams_arr?: StationTime;
  };
  // Return: AMS → Hazeldonk → BRU → Wannehain → PNO
  return: {
    ams_dep?: StationTime;
    hdk_arr?: StationTime;
    bru_arr?: StationTime;
    bru_dep?: StationTime;
    wnh_arr?: StationTime;
    pno_arr?: StationTime;
  };
}

export interface SystemData {
  status: "Published" | "Manually_Created" | "Automatically_Created" | "Not_Visible";
  visible: boolean;
  schedule: JourneySchedule;
}

export interface TrainService {
  service_id: string;
  date: string | null; // null for "régimé" reference rows
  period_id?: string; // Period this service belongs to (e.g., "2025-X1", "2025-X2")
  train_info: {
    train_number: string;
    description: string;
    crew: {
      driver: "Blue";
      train_manager: "Red";
    };
  };
  systems_data: {
    totem_plus: SystemData;
    tam_tam: SystemData;
    e_roster: SystemData;
  };
  verification: {
    tam_tam_ok: boolean;
    e_roster_ok: boolean;
  };
}

export interface Period {
  id: string;
  name: string;
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
  regime: {
    monday?: TrainService[];
    tuesday?: TrainService[];
    wednesday?: TrainService[];
    thursday?: TrainService[];
    friday?: TrainService[];
    saturday?: TrainService[];
    sunday?: TrainService[];
  };
  bonus_trains: TrainService[]; // Trains that belong to period but are not part of regular weekly schedule
  actual_services: TrainService[];
}

// Reference schedule (régimé) - typical Friday schedule
const regimeSchedules: TrainService[] = [
  {
    service_id: "regime-9320",
    date: null,
    train_info: {
      train_number: "9320",
      description: "Blue train with mixed crew - Return journey only",
      crew: { driver: "Blue", train_manager: "Red" }
    },
    systems_data: {
      totem_plus: {
        status: "Published",
        visible: true,
        schedule: {
          outbound: {},
          return: {
            bru_dep: { time: "09:43" },
            wnh_arr: { time: "10:09", border_crossing: true },
            pno_arr: { time: "11:05" }
          }
        }
      },
      tam_tam: {
        status: "Manually_Created",
        visible: true,
        schedule: {
          outbound: {},
          return: {
            bru_dep: { time: "09:43" },
            wnh_arr: { time: "10:09", border_crossing: true },
            pno_arr: { time: "11:05" }
          }
        }
      },
      e_roster: {
        status: "Automatically_Created",
        visible: true,
        schedule: {
          outbound: {},
          return: {
            bru_dep: { time: "09:43" },
            wnh_arr: { time: "10:09", border_crossing: true },
            pno_arr: { time: "11:05" }
          }
        }
      }
    },
    verification: {
      tam_tam_ok: true,
      e_roster_ok: true,
    }
  },
  {
    service_id: "regime-9339",
    date: null,
    train_info: {
      train_number: "9339",
      description: "Blue train with mixed crew - Outbound journey only",
      crew: { driver: "Blue", train_manager: "Red" }
    },
    systems_data: {
      totem_plus: {
        status: "Published",
        visible: true,
        schedule: {
          outbound: {
            pno_dep: { time: "12:22" },
            wnh_arr: { time: "13:18", border_crossing: true },
            bru_arr: { time: "13:44" },
            bru_dep: { time: "13:53" },
            hdk_arr: { time: "14:45", border_crossing: true },
            ams_arr: { time: "15:50" }
          },
          return: {}
        }
      },
      tam_tam: {
        status: "Manually_Created",
        visible: true,
        schedule: {
          outbound: {
            pno_dep: { time: "12:22" },
            wnh_arr: { time: "13:18", border_crossing: true },
            bru_arr: { time: "13:44" },
            bru_dep: { time: "13:53" },
            hdk_arr: { time: "14:45", border_crossing: true },
            ams_arr: { time: "15:50" }
          },
          return: {}
        }
      },
      e_roster: {
        status: "Automatically_Created",
        visible: true,
        schedule: {
          outbound: {
            pno_dep: { time: "12:22" },
            wnh_arr: { time: "13:18", border_crossing: true },
            bru_arr: { time: "13:44" },
            bru_dep: { time: "13:53" },
            hdk_arr: { time: "14:45", border_crossing: true },
            ams_arr: { time: "15:50" }
          },
          return: {}
        }
      }
    },
    verification: {
      tam_tam_ok: true,
      e_roster_ok: true,
    }
  },
  {
    service_id: "regime-9376",
    date: null,
    train_info: {
      train_number: "9376",
      description: "Blue train with mixed crew - Return journey only",
      crew: { driver: "Blue", train_manager: "Red" }
    },
    systems_data: {
      totem_plus: {
        status: "Published",
        visible: true,
        schedule: {
          outbound: {},
          return: {
            ams_dep: { time: "17:10" },
            hdk_arr: { time: "18:16", border_crossing: true },
            bru_arr: { time: "19:06" },
            bru_dep: { time: "19:13" },
            wnh_arr: { time: "19:39", border_crossing: true },
            pno_arr: { time: "20:35" }
          }
        }
      },
      tam_tam: {
        status: "Manually_Created",
        visible: true,
        schedule: {
          outbound: {},
          return: {
            ams_dep: { time: "17:10" },
            hdk_arr: { time: "18:16", border_crossing: true },
            bru_arr: { time: "19:06" },
            bru_dep: { time: "19:13" },
            wnh_arr: { time: "19:39", border_crossing: true },
            pno_arr: { time: "20:35" }
          }
        }
      },
      e_roster: {
        status: "Automatically_Created",
        visible: true,
        schedule: {
          outbound: {},
          return: {
            ams_dep: { time: "17:10" },
            hdk_arr: { time: "18:16", border_crossing: true },
            bru_arr: { time: "19:06" },
            bru_dep: { time: "19:13" },
            wnh_arr: { time: "19:39", border_crossing: true },
            pno_arr: { time: "20:35" }
          }
        }
      }
    },
    verification: {
      tam_tam_ok: true,
      e_roster_ok: true,
    }
  },
  {
    service_id: "regime-9395",
    date: null,
    train_info: {
      train_number: "9395",
      description: "Blue train with mixed crew - Outbound journey only",
      crew: { driver: "Blue", train_manager: "Red" }
    },
    systems_data: {
      totem_plus: {
        status: "Published",
        visible: true,
        schedule: {
          outbound: {
            pno_dep: { time: "21:34" },
            wnh_arr: { time: "22:43", border_crossing: true },
            bru_arr: { time: "23:09" }
          },
          return: {}
        }
      },
      tam_tam: {
        status: "Manually_Created",
        visible: true,
        schedule: {
          outbound: {
            pno_dep: { time: "21:34" },
            wnh_arr: { time: "22:43", border_crossing: true },
            bru_arr: { time: "23:09" }
          },
          return: {}
        }
      },
      e_roster: {
        status: "Automatically_Created",
        visible: true,
        schedule: {
          outbound: {
            pno_dep: { time: "21:34" },
            wnh_arr: { time: "22:43", border_crossing: true },
            bru_arr: { time: "23:09" }
          },
          return: {}
        }
      }
    },
    verification: {
      tam_tam_ok: true,
      e_roster_ok: true,
    }
  }
];

// Duplicate regime schedules for Saturday (Samedi)
const regimeSchedulesSamedi: TrainService[] = regimeSchedules.map(service => ({
  ...service,
  service_id: service.service_id.replace('regime-', 'regime-saturday-')
}));

// Helper function to create actual service from regime with potential modifications
const createActualService = (
  regimeService: TrainService,
  date: string,
  period_id: string,
  modifications?: {
    totem_schedule?: Partial<JourneySchedule>;
    tamtam_schedule?: Partial<JourneySchedule>;
    tamtam_no_data?: boolean; // TamTam not yet created (no schedule data)
    eroster_visible?: boolean;
    eroster_no_data?: boolean; // eRoster bug (no schedule data)
    verifications?: Partial<TrainService["verification"]>;
  }
): TrainService => {
  const service = JSON.parse(JSON.stringify(regimeService)) as TrainService;
  service.service_id = `${date.replace(/-/g, "")}-${service.train_info.train_number}`;
  service.date = date;
  service.period_id = period_id;

  if (modifications?.totem_schedule) {
    service.systems_data.totem_plus.schedule = {
      ...service.systems_data.totem_plus.schedule,
      ...modifications.totem_schedule
    };
  }

  if (modifications?.tamtam_no_data) {
    // TamTam not yet created - no schedule data
    service.systems_data.tam_tam.schedule = { outbound: {}, return: {} };
    service.systems_data.tam_tam.status = "Not_Visible";
    service.systems_data.tam_tam.visible = true;
  } else if (modifications?.tamtam_schedule) {
    service.systems_data.tam_tam.schedule = {
      ...service.systems_data.tam_tam.schedule,
      ...modifications.tamtam_schedule
    };
  }

  if (modifications?.eroster_no_data) {
    // eRoster bug - no schedule data
    service.systems_data.e_roster.schedule = { outbound: {}, return: {} };
    service.systems_data.e_roster.status = "Not_Visible";
    service.systems_data.e_roster.visible = true;
  } else if (modifications?.eroster_visible !== undefined) {
    service.systems_data.e_roster.visible = modifications.eroster_visible;
    service.systems_data.e_roster.status = modifications.eroster_visible 
      ? "Automatically_Created" 
      : "Not_Visible";
  }

  if (modifications?.verifications) {
    service.verification = {
      ...service.verification,
      ...modifications.verifications
    };
  }

  return service;
};

// Actual date services
const actualServices: TrainService[] = [
  // 2025-06-20 (Friday)
  ...regimeSchedules.map(regime => createActualService(regime, "2025-06-20", "2025-X1")),
  // 2025-06-21 (Saturday)
  ...regimeSchedulesSamedi.map(regime => createActualService(regime, "2025-06-21", "2025-X1")),
  
  // 2025-06-27 (Friday)
  ...regimeSchedules.map(regime => createActualService(regime, "2025-06-27", "2025-X1")),
  // 2025-06-28 (Saturday)
  ...regimeSchedulesSamedi.map(regime => createActualService(regime, "2025-06-28", "2025-X1")),
  
  // 2025-07-04 (Friday) - with some discrepancies
  createActualService(regimeSchedules[0], "2025-07-04", "2025-X1"), // 9320
  createActualService(regimeSchedules[1], "2025-07-04", "2025-X1", { // 9339 - TamTam has different time
    tamtam_schedule: {
      outbound: {
        pno_dep: { time: "12:20" }, // TamTam shows 12:20, but Totem+ has 12:22
        wnh_arr: { time: "13:18", border_crossing: true },
        bru_arr: { time: "13:44" },
        bru_dep: { time: "13:53" },
        hdk_arr: { time: "14:45", border_crossing: true },
        ams_arr: { time: "15:50" }
      },
      return: {}
    }
  }),
  createActualService(regimeSchedules[2], "2025-07-04", "2025-X1"), // 9376
  createActualService(regimeSchedules[3], "2025-07-04", "2025-X1", { // 9395
  }),
  // 2025-07-05 (Saturday)
  ...regimeSchedulesSamedi.map(regime => createActualService(regime, "2025-07-05", "2025-X1")),
  
  // 2025-07-11 (Friday) - with eRoster bug (missing data) for 9339 and 9395
  createActualService(regimeSchedules[0], "2025-07-11", "2025-X1"), // 9320
  createActualService(regimeSchedules[1], "2025-07-11", "2025-X1", { // 9339 - eRoster bug: no data
    eroster_no_data: true,
    verifications: { e_roster_ok: false }
  }),
  createActualService(regimeSchedules[2], "2025-07-11", "2025-X1"), // 9376
  createActualService(regimeSchedules[3], "2025-07-11", "2025-X1", { // 9395 - eRoster bug: no data
    eroster_no_data: true,
  }),
  // 2025-07-12 (Saturday)
  ...regimeSchedulesSamedi.map(regime => createActualService(regime, "2025-07-12", "2025-X1")),
  
  // 2025-07-18 (Friday) - with TamTam not yet created for 9320
  createActualService(regimeSchedules[0], "2025-07-18", "2025-X1", { // 9320 - TamTam not yet created
    tamtam_no_data: true,
    verifications: { tam_tam_ok: false }
  }),
  createActualService(regimeSchedules[1], "2025-07-18", "2025-X1"), // 9339
  createActualService(regimeSchedules[2], "2025-07-18", "2025-X1"), // 9376
  createActualService(regimeSchedules[3], "2025-07-18", "2025-X1", { // 9395
  }),
  // 2025-07-19 (Saturday)
  ...regimeSchedulesSamedi.map(regime => createActualService(regime, "2025-07-19", "2025-X1"))
];

// Bonus train 9303 for 2025-07-10
const bonusTrain9303: TrainService = {
  service_id: "bonus-9303-20250710",
  date: "2025-07-10",
  period_id: "2025-X1",
  train_info: {
    train_number: "9303",
    description: "Bonus train - Outbound only",
    crew: { driver: "Blue", train_manager: "Red" }
  },
  systems_data: {
    totem_plus: {
      status: "Published",
      visible: true,
      schedule: {
        outbound: {
          pno_dep: { time: "06:18", changed: false },
          wnh_arr: { time: "07:18", changed: false },
          bru_arr: { time: "07:44", changed: false },
          bru_dep: { time: "07:53", changed: false },
          hdk_arr: { time: "08:45", changed: false },
          ams_arr: { time: "10:15", changed: false }
        },
        return: {
          ams_dep: undefined,
          hdk_arr: undefined,
          bru_arr: undefined,
          bru_dep: undefined,
          wnh_arr: undefined,
          pno_arr: undefined
        }
      }
    },
    tam_tam: {
      status: "Published",
      visible: true,
      schedule: {
        outbound: {
          pno_dep: { time: "06:18", changed: false },
          wnh_arr: { time: "07:18", changed: false },
          bru_arr: { time: "07:44", changed: false },
          bru_dep: { time: "07:53", changed: false },
          hdk_arr: { time: "08:45", changed: false },
          ams_arr: { time: "10:15", changed: false }
        },
        return: {
          ams_dep: undefined,
          hdk_arr: undefined,
          bru_arr: undefined,
          bru_dep: undefined,
          wnh_arr: undefined,
          pno_arr: undefined
        }
      }
    },
    e_roster: {
      status: "Published",
      visible: true,
      schedule: {
        outbound: {
          pno_dep: { time: "06:18", changed: false },
          wnh_arr: { time: "07:18", changed: false },
          bru_arr: { time: "07:44", changed: false },
          bru_dep: { time: "07:53", changed: false },
          hdk_arr: { time: "08:45", changed: false },
          ams_arr: { time: "10:15", changed: false }
        },
        return: {
          ams_dep: undefined,
          hdk_arr: undefined,
          bru_arr: undefined,
          bru_dep: undefined,
          wnh_arr: undefined,
          pno_arr: undefined
        }
      }
    }
  },
  verification: {
    tam_tam_ok: true,
    e_roster_ok: true
  }
};
// Period 2025-X1: June 1 - July 25, 2025
const period2025X1: Period = {
  id: "2025-x1",
  name: "2025-X1",
  start_date: "2025-06-01",
  end_date: "2025-07-25",
  regime: {
    friday: regimeSchedules.map(s => ({...s, service_id: s.service_id.replace('regime-', 'regime-friday-')})),
    saturday: regimeSchedulesSamedi.map(s => ({...s, service_id: s.service_id.replace('regime-', 'regime-saturday-')}))
  },
  bonus_trains: [bonusTrain9303],
  actual_services: actualServices
};

// Period 2025-X2: August 1 - August 15, 2025 (no data yet)
const period2025X2: Period = {
  id: "2025-x2",
  name: "2025-X2",
  start_date: "2025-08-01",
  end_date: "2025-08-15",
  regime: {
    friday: [],
    saturday: []
  },
  bonus_trains: [],
  actual_services: []
};

export const periods: Period[] = [
  period2025X1,
  period2025X2
];

// Legacy export for backward compatibility
export const trainData = {
  regime: {
    friday: regimeSchedules.map(s => ({...s, service_id: s.service_id.replace('regime-', 'regime-friday-')})),
    saturday: regimeSchedulesSamedi.map(s => ({...s, service_id: s.service_id.replace('regime-', 'regime-saturday-')}))
  },
  actual: actualServices
};
