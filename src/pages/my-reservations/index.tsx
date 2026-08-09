import { createFileRoute } from '@tanstack/react-router';
import { MyReservations } from './-components/MyReservations';

export const Route = createFileRoute('/my-reservations/')({
  component: MyReservations,
});
