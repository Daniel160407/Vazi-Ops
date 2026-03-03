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
