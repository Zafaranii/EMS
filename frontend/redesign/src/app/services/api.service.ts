import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Hotels
  getHotels(): Observable<any> {
    return this.http.get(`${this.apiUrl}/hotels`);
  }

  addHotel(data: { name: string; address: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/hotels`, data);
  }

  addRoom(hotelId: string, data: { roomName: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/hotels/${hotelId}/rooms`, data);
  }

  addRoomSlot(roomId: string, data: { slotDate: string; startTime: string; endTime: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/hotels/rooms/${roomId}/slots`, data);
  }

  deleteHotel(hotelId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/hotels/${hotelId}`);
  }

  deleteRoom(roomId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/hotels/rooms/${roomId}`);
  }

  deleteRoomSlot(slotId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/hotels/slots/${slotId}`);
  }

  // Investors
  getInvestors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/investors`);
  }

  addInvestor(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/investors`, data);
  }

  updateInvestor(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/investors/${id}`, data);
  }

  deleteInvestor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/investors/${id}`);
  }

  // Presenters
  getPresenters(): Observable<any> {
    return this.http.get(`${this.apiUrl}/presenters`);
  }

  addPresenter(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/presenters`, data);
  }

  updatePresenter(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/presenters/${id}`, data);
  }

  deletePresenter(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/presenters/${id}`);
  }

  // Reservations
  getReservations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reservations`);
  }

  addReservation(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservations/confirm`, data);
  }

  getMatchingPresenters(params: { sectorId: number; startTime: string; endTime: string; slotDate?: string }): Observable<any> {
    return this.http.get(`${this.apiUrl}/reservations/match-presenters`, { params: params as any });
  }

  getAvailableRooms(params: { startTime: string; slotDate?: string }): Observable<any> {
    return this.http.get(`${this.apiUrl}/reservations/available-rooms`, { params: params as any });
  }

  getInvestorBookedTimes(params: { investorId: string; slotDate?: string }): Observable<any> {
    return this.http.get(`${this.apiUrl}/reservations/investor-booked-times`, { params: params as any });
  }

  // Sectors
  getSectors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sectors`);
  }
}
