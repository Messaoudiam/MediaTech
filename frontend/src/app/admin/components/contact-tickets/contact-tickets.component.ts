import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import {
  ContactTicketService,
  ContactTicket,
} from '../../services/contact-ticket.service';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-contact-tickets',
  templateUrl: './contact-tickets.component.html',
  styleUrls: ['./contact-tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
  ],
})
export class ContactTicketsComponent implements OnInit {
  tickets: ContactTicket[] = [];
  filteredTickets: ContactTicket[] = [];
  displayedColumns: string[] = [
    'id',
    'name',
    'email',
    'subject',
    'createdAt',
    'status',
    'actions',
  ];
  loading = true;
  filterValue = '';
  statusFilter = 'all';
  error: string | null = null;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private ticketService: ContactTicketService
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  /**
   * Charge les tickets depuis l'API
   */
  loadTickets(): void {
    this.loading = true;
    this.error = null;

    this.ticketService
      .getAllTickets()
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        catchError((err) => {
          this.error =
            'Erreur lors du chargement des tickets. Veuillez réessayer.';
          console.error('Erreur lors du chargement des tickets', err);
          return of([]);
        })
      )
      .subscribe((tickets) => {
        // Traitement des statuts pour la compatibilité avec l'interface
        this.tickets = tickets.map((ticket) => ({
          ...ticket,
          isResolved:
            ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
        }));
        this.filteredTickets = [...this.tickets];
      });
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterTickets();
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.filterTickets();
  }

  filterTickets(): void {
    this.filteredTickets = this.tickets.filter((ticket) => {
      // Filtrer par texte
      const matchesText =
        ticket.name.toLowerCase().includes(this.filterValue) ||
        ticket.email.toLowerCase().includes(this.filterValue) ||
        ticket.subject.toLowerCase().includes(this.filterValue);

      // Filtrer par statut
      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'resolved' && ticket.isResolved) ||
        (this.statusFilter === 'pending' && !ticket.isResolved);

      return matchesText && matchesStatus;
    });
  }

  markAsResolved(ticket: ContactTicket): void {
    this.ticketService
      .markAsResolved(ticket.id)
      .pipe(
        catchError((err) => {
          this.snackBar.open('Erreur lors du traitement du ticket', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          console.error('Erreur lors du traitement du ticket', err);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          ticket.isResolved = true;
          ticket.status = 'RESOLVED';
          this.snackBar.open('Ticket marqué comme résolu', 'Fermer', {
            duration: 3000,
          });
        }
      });
  }

  viewTicketDetails(ticket: ContactTicket): void {
    // TODO: Implémenter l'affichage des détails du ticket
    console.log('Affichage des détails du ticket:', ticket);
  }

  replyToTicket(ticket: ContactTicket): void {
    // TODO: Implémenter la réponse au ticket dans une boîte de dialogue
    console.log('Répondre au ticket:', ticket);
  }

  /**
   * Rafraîchit la liste des tickets
   */
  refreshTickets(): void {
    this.loadTickets();
  }
}
