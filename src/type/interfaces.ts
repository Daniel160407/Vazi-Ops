export interface Group {
  id: string;
  name: string;
  leader: string;
  age: string;
  cottage_num: number;
  gender: string;
  children: string[];
}

export interface Club {
  id: string;
  name: string;
  teacher: string;
  places_quantity: number;
  place: string;
  time: Date;
  additional_info: string;
}

export interface ClubBooking {
  id: string;
  club_id: string;
  club_name: string;
  child_first_name: string;
  child_last_name: string;
  leader_name: string;
  group_name: string;
  created_at: Date;
}

export interface Schedule {
  id: string;
  name: string;
  image_url: string;
}

export interface EveningScheduleItem {
  id: string;
  scene_name: string;
  performer_full_name: string;
  leader_full_name: string;
  group_name: string;
  media_url: string;
  position: number;
  created_at: Date;
}

export interface Event {
  id: string;
  scene_name: string;
  performer_full_name: string;
  leader_full_name: string;
  group_name: string;
  media_url: string;
  additional_info: string;
  request_status: string;
  created_at: Date;
}

export interface Deadline {
  id: string;
  time: Date;
}

export interface GoldenVerse {
  id: string;
  verse: string;
  reference: string;
  day: Date;
}
