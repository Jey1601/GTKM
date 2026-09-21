import { Question } from '../types';

export interface QuestionPack {
  id: string;
  name: string;
  description: string;
  emoji: string;
  questions: Question[];
}

export const DEFAULT_QUESTION_PACKS: QuestionPack[] = [
  {
    id: 'pack_amigos',
    name: 'Anécdotas y Momentos Épicos',
    description: 'Preguntas divertidas para descubrir historias secretas entre amigos y familia.',
    emoji: '🎉',
    questions: [
      {
        id: 'q1',
        text: '¿Cuál es el momento más vergonzoso que recuerdas haber pasado en público?',
        category: 'Anécdotas'
      },
      {
        id: 'q2',
        text: 'Si ganaras 1 millón de dólares mañana, ¿cuál es la primera compra absurda o inútil que harías?',
        category: 'Fantasía'
      },
      {
        id: 'q3',
        text: '¿Qué comida todo el mundo ama pero a ti en secreto te parece horrible?',
        category: 'Gustos'
      },
      {
        id: 'q4',
        text: 'Si te arrestaran sin dar explicaciones, ¿qué crimen asumirían tus amigos que cometiste?',
        category: 'Travesuras'
      },
      {
        id: 'q5',
        text: '¿Cuál es tu talento más inútil, raro o secreto?',
        category: 'Secretos'
      }
    ]
  },
  {
    id: 'pack_secretos',
    name: 'Confesiones Picantes y Risas',
    description: '¿Quién es más probable que...? ¡Revela pequeños secretos inofensivos!',
    emoji: '🌶️',
    questions: [
      {
        id: 'q_sec_1',
        text: '¿Cuál fue tu mentira piadosa más ridícula que se te salió de las manos?',
        category: 'Confesiones'
      },
      {
        id: 'q_sec_2',
        text: '¿Cuál es tu placer culposo de música o película que jamás admites en público?',
        category: 'Gustos'
      },
      {
        id: 'q_sec_3',
        text: '¿Qué es lo más tonto por lo que te has obsesionado en internet a las 3 de la mañana?',
        category: 'Curiosidades'
      },
      {
        id: 'q_sec_4',
        text: 'Si pudieras borrar un recuerdo bochornoso de tu vida, ¿cuál sería?',
        category: 'Secretos'
      }
    ]
  },
  {
    id: 'pack_familia',
    name: 'Reunión Familiar',
    description: 'Preguntas para jugar con primos, tíos, abuelos y hermanos de todas las edades.',
    emoji: '🏡',
    questions: [
      {
        id: 'q_fam_1',
        text: '¿Qué travesura de niño nunca le contaste a tus padres?',
        category: 'Familia'
      },
      {
        id: 'q_fam_2',
        text: '¿Cuál es la manía o costumbre más extraña que tienes al levantarte?',
        category: 'Hábitos'
      },
      {
        id: 'q_fam_3',
        text: 'Si tuviéramos un apocalipsis zombi, ¿quién de la familia sobreviviría menos tiempo y por qué?',
        category: 'Humor'
      },
      {
        id: 'q_fam_4',
        text: '¿Qué platillo familiar es el que mejor te sale o el que más te da miedo cocinar?',
        category: 'Cocina'
      }
    ]
  }
];
