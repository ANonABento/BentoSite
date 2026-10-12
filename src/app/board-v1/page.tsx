import { Board } from '@/components/board/Board';
import { buildBoard } from '@/lib/board';
import './board.css';

// The first board iteration, restored side by side with the BentoGrid on `/`
// so the two can be compared before merging the best of both.
export default function BoardV1Page() {
  return <Board board={buildBoard()} />;
}
