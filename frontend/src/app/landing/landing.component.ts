import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../core/components/navbar/navbar.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    NavbarComponent,
  ],
})
export class LandingComponent implements OnInit {
  featuredBooks = [
    {
      id: '1',
      title: 'Le Seigneur des Anneaux',
      author: 'J.R.R. Tolkien',
      coverImageUrl:
        'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
      description: "L'histoire épique de la Terre du Milieu",
    },
    {
      id: '2',
      title: '1984',
      author: 'George Orwell',
      coverImageUrl:
        'https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg',
      description: 'Un roman dystopique sur un futur totalitaire',
    },
    {
      id: '3',
      title: 'Dune',
      author: 'Frank Herbert',
      coverImageUrl:
        'https://m.media-amazon.com/images/I/81aA7hEEykL._AC_UF1000,1000_QL80_.jpg',
      description: "L'épopée de science-fiction sur la planète Arrakis",
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
