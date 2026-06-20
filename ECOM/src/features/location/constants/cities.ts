export interface CitySuggestion {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const CITIES: CitySuggestion[] = [
  { city: "Ahmedabad", state: "Gujarat", country: "India", latitude: 23.0225, longitude: 72.5714 },
  { city: "Surat", state: "Gujarat", country: "India", latitude: 21.1702, longitude: 72.8311 },
  { city: "Vadodara", state: "Gujarat", country: "India", latitude: 22.3072, longitude: 73.1812 },
  { city: "Rajkot", state: "Gujarat", country: "India", latitude: 22.3039, longitude: 70.8022 },
  { city: "Gandhinagar", state: "Gujarat", country: "India", latitude: 23.2156, longitude: 72.6369 },
  { city: "Mumbai", state: "Maharashtra", country: "India", latitude: 19.0760, longitude: 72.8777 },
  { city: "Pune", state: "Maharashtra", country: "India", latitude: 18.5204, longitude: 73.8567 },
  { city: "Nagpur", state: "Maharashtra", country: "India", latitude: 21.1458, longitude: 79.0882 },
  { city: "Delhi", state: "Delhi", country: "India", latitude: 28.7041, longitude: 77.1025 },
  { city: "Bengaluru", state: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946 },
  { city: "Chennai", state: "Tamil Nadu", country: "India", latitude: 13.0827, longitude: 80.2707 },
  { city: "Hyderabad", state: "Telangana", country: "India", latitude: 17.3850, longitude: 78.4867 },
  { city: "Kolkata", state: "West Bengal", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { city: "Jaipur", state: "Rajasthan", country: "India", latitude: 26.9124, longitude: 75.7873 },
  { city: "Lucknow", state: "Uttar Pradesh", country: "India", latitude: 26.8467, longitude: 80.9462 },
  { city: "Kanpur", state: "Uttar Pradesh", country: "India", latitude: 26.4499, longitude: 80.3319 },
  { city: "Noida", state: "Uttar Pradesh", country: "India", latitude: 28.5355, longitude: 77.3910 },
  { city: "Gurugram", state: "Haryana", country: "India", latitude: 28.4595, longitude: 77.0266 },
  { city: "Chandigarh", state: "Punjab & Haryana", country: "India", latitude: 30.7333, longitude: 76.7794 },
  { city: "Indore", state: "Madhya Pradesh", country: "India", latitude: 22.7196, longitude: 75.8577 },
  { city: "Bhopal", state: "Madhya Pradesh", country: "India", latitude: 23.2599, longitude: 77.4126 },
  { city: "Kochi", state: "Kerala", country: "India", latitude: 9.9312, longitude: 76.2673 },
  { city: "Thiruvananthapuram", state: "Kerala", country: "India", latitude: 8.5241, longitude: 76.9366 },
  { city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", latitude: 17.6868, longitude: 83.2185 },
  { city: "Patna", state: "Bihar", country: "India", latitude: 25.5941, longitude: 85.1376 },
  { city: "Bhubaneswar", state: "Odisha", country: "India", latitude: 20.2961, longitude: 85.8245 },
  { city: "Guwahati", state: "Assam", country: "India", latitude: 26.1158, longitude: 91.7086 },
];
