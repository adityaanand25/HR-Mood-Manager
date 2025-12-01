"""
Emotion Detection RAG System - VS Code Version
100% FREE - No API keys required
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import argparse
import warnings
warnings.filterwarnings('ignore')

# Deep learning imports
from deepface import DeepFace
import cv2

# RAG imports
import chromadb
from sentence_transformers import SentenceTransformer

# Configuration
class Config:
    DATA_DIR = "data"
    UPLOAD_DIR = "uploads"
    DB_DIR = "data/chroma_db"
    HISTORY_FILE = "data/emotions.json"
    
    @classmethod
    def setup(cls):
        """Create directories"""
        for d in [cls.DATA_DIR, cls.UPLOAD_DIR, cls.DB_DIR]:
            Path(d).mkdir(parents=True, exist_ok=True)

# Emotion Detector
class EmotionDetector:
    def __init__(self, history_file: str = Config.HISTORY_FILE):
        self.history_file = history_file
        self.history = []
        self.load()
    
    def get_database_records(self):
        """Load mood records from database"""
        try:
            from database import get_mood_records
            db_records = get_mood_records()
            
            # Convert database records to history format
            history = []
            for record in db_records:
                history.append({
                    'time': record['timestamp'],
                    'emotion': record['emotion'],
                    'scores': {
                        'happy': record['confidence'] if record['emotion'] == 'happy' else 0,
                        'sad': record['confidence'] if record['emotion'] == 'sad' else 0,
                        'angry': record['confidence'] if record['emotion'] == 'angry' else 0,
                        'fear': record['confidence'] if record['emotion'] == 'fear' else 0,
                        'surprise': record['confidence'] if record['emotion'] == 'surprise' else 0,
                        'disgust': record['confidence'] if record['emotion'] == 'disgust' else 0,
                        'neutral': record['confidence'] if record['emotion'] == 'neutral' else 0
                    },
                    'path': 'database'
                })
            
            return history
        except Exception as e:
            print(f"⚠️  Could not load from database: {e}")
            return []
    
    def detect(self, image_path: str) -> Optional[Dict]:
        """Detect emotion from image"""
        try:
            print(f"🔍 Analyzing {image_path}...")
            
            result = DeepFace.analyze(
                img_path=image_path,
                actions=['emotion'],
                enforce_detection=False
            )
            
            if isinstance(result, list):
                result = result[0]
            
            data = {
                'time': datetime.now().isoformat(),
                'emotion': result['dominant_emotion'],
                'scores': result['emotion'],
                'path': image_path
            }
            
            self.history.append(data)
            self.save()
            
            print(f"✅ Detected: {data['emotion']}")
            return data
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def detect_from_webcam(self, duration: int = 10):
        """Capture and analyze from webcam"""
        print(f"📸 Starting webcam for {duration} seconds...")
        print("Press 'q' to quit early")
        
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ Could not open webcam")
            return
        
        start_time = datetime.now()
        frame_count = 0
        
        while (datetime.now() - start_time).seconds < duration:
            ret, frame = cap.read()
            if not ret:
                break
            
            cv2.imshow('Emotion Detection (Press Q to quit)', frame)
            
            # Analyze every 2 seconds (every 60 frames)
            if frame_count % 60 == 0:
                temp_path = f"{Config.UPLOAD_DIR}/webcam_frame.jpg"
                cv2.imwrite(temp_path, frame)
                self.detect(temp_path)
            
            frame_count += 1
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("✅ Webcam analysis complete")
    
    def analyze_directory(self, directory: str):
        """Analyze all images in directory"""
        image_exts = ['.jpg', '.jpeg', '.png', '.bmp']
        image_files = []
        
        for ext in image_exts:
            image_files.extend(Path(directory).glob(f"*{ext}"))
            image_files.extend(Path(directory).glob(f"*{ext.upper()}"))
        
        print(f"\n📂 Found {len(image_files)} images")
        
        results = []
        for img_path in image_files:
            data = self.detect(str(img_path))
            if data:
                results.append(data)
        
        return results
    
    def save(self):
        """Save history to JSON"""
        Path(self.history_file).parent.mkdir(parents=True, exist_ok=True)
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f, indent=2)
    
    def load(self):
        """Load history from database first, then JSON as fallback"""
        # Try loading from database
        db_history = self.get_database_records()
        if db_history:
            self.history = db_history
            print(f"[DB] Loaded {len(self.history)} records from database")
            return
        
        # Fallback to JSON
        try:
            with open(self.history_file, 'r') as f:
                self.history = json.load(f)
            print(f"[JSON] Loaded {len(self.history)} records from JSON")
        except FileNotFoundError:
            print("[INIT] Starting fresh")
            self.history = []
    
    def get_stats(self) -> Optional[Dict]:
        """Get statistics"""
        if not self.history:
            return None
        
        counts = {}
        total_scores = {}
        
        for r in self.history:
            e = r['emotion']
            counts[e] = counts.get(e, 0) + 1
            
            for emotion, score in r['scores'].items():
                if emotion not in total_scores:
                    total_scores[emotion] = []
                total_scores[emotion].append(score)
        
        avg_scores = {e: np.mean(scores) for e, scores in total_scores.items()}
        
        return {
            'total': len(self.history),
            'counts': counts,
            'most_common': max(counts, key=counts.get),
            'latest': self.history[-1]['emotion'],
            'avg_scores': avg_scores
        }
    
    def display_stats(self):
        """Display statistics"""
        stats = self.get_stats()
        if not stats:
            print("No data yet!")
            return
        
        print("\n" + "="*60)
        print("📊 EMOTION STATISTICS")
        print("="*60)
        print(f"Total records: {stats['total']}")
        print(f"Most common: {stats['most_common']}")
        print(f"Latest: {stats['latest']}")
        print("\nDistribution:")
        
        for emotion, count in sorted(stats['counts'].items(), 
                                     key=lambda x: x[1], reverse=True):
            pct = count / stats['total'] * 100
            bar = "█" * int(pct / 3)
            print(f"  {emotion:12s}: {count:3d} ({pct:5.1f}%) {bar}")

# RAG System
class EmotionRAG:
    def __init__(self):
        print("🤖 Loading AI model...")
        try:
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"⚠️  Could not load embedder (offline mode): {e}")
            self.embedder = None
        
        self.chroma = chromadb.PersistentClient(path=Config.DB_DIR)
        self.collection = None
        print("✅ AI model ready")
    
    def build(self, history: List[Dict]) -> bool:
        """Build vector database from history"""
        if not history:
            print("❌ No history to build from")
            return False
        
        print(f"🔨 Building database from {len(history)} records...")
        
        # Delete old collection
        try:
            self.chroma.delete_collection("emotions")
        except:
            pass
        
        # Create new collection
        self.collection = self.chroma.create_collection("emotions")
        
        # Prepare documents
        docs = []
        ids = []
        metas = []
        
        for i, rec in enumerate(history):
            # Handle both old format (scores dict) and new format (just emotion)
            if isinstance(rec.get('scores'), dict):
                scores = ", ".join([f"{k}: {v:.1f}%" for k, v in rec['scores'].items()])
            else:
                scores = f"{rec['emotion']}: 100%"
            
            time_str = rec['time'][:19].replace('T', ' ')
            
            text = f"""Record {i+1} at {time_str}
Dominant emotion: {rec['emotion']}
Confidence scores: {scores}
Analysis: The person was feeling {rec['emotion']} at this time."""
            
            docs.append(text)
            ids.append(f"rec_{i}")
            metas.append({
                'emotion': rec['emotion'],
                'time': rec['time'],
                'id': i
            })
        
        # Add to collection if embedder available, otherwise just store metadata
        if self.embedder:
            self.collection.add(documents=docs, ids=ids, metadatas=metas)
        else:
            # Fallback: store without embeddings
            self.collection.add(documents=docs, ids=ids, metadatas=metas)
        
        print(f"✅ Database ready with {len(docs)} records")
        return True
    
    def query(self, question: str) -> str:
        """Query the RAG system"""
        if not self.collection:
            return "❌ Build database first!"
        
        # Get relevant documents
        results = self.collection.query(query_texts=[question], n_results=5)
        docs = results['documents'][0]
        metas = results['metadatas'][0]
        
        # Analyze retrieved data
        emotions = [m['emotion'] for m in metas]
        emotion_counts = {}
        for e in emotions:
            emotion_counts[e] = emotion_counts.get(e, 0) + 1
        
        # Generate smart answer based on question
        q_lower = question.lower()
        
        if 'most' in q_lower or 'common' in q_lower or 'frequent' in q_lower:
            most = max(emotion_counts, key=emotion_counts.get)
            return f"Based on the records, '{most}' is the most common emotion, appearing {emotion_counts[most]} times in relevant data."
        
        elif 'recent' in q_lower or 'latest' in q_lower or 'last' in q_lower:
            latest = metas[0]['emotion']
            latest_time = metas[0]['time'][:19].replace('T', ' ')
            return f"The most recent emotion detected was '{latest}' at {latest_time}."
        
        elif 'pattern' in q_lower or 'trend' in q_lower:
            summary = ", ".join([f"{e}: {c} times" for e, c in emotion_counts.items()])
            return f"The emotional patterns show: {summary}. This indicates varying emotional states with emphasis on {max(emotion_counts, key=emotion_counts.get)}."
        
        elif 'happy' in q_lower or 'sad' in q_lower or 'angry' in q_lower:
            target_emotions = [e for e in ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'] if e in q_lower]
            if target_emotions:
                target = target_emotions[0]
                count = emotion_counts.get(target, 0)
                return f"'{target}' appears {count} times in the relevant records, suggesting it's {'a significant' if count > 2 else 'a minor'} part of the emotional pattern."
        
        elif 'feel' in q_lower or 'emotion' in q_lower:
            most = max(emotion_counts, key=emotion_counts.get)
            summary = ", ".join([f"{e} ({c}x)" for e, c in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)])
            return f"Overall emotional state shows: {summary}. You appear to feel {most} most frequently."
        
        else:
            # Generic answer
            summary = ", ".join([f"{e} ({c}x)" for e, c in emotion_counts.items()])
            return f"Based on relevant emotion records: {summary}. The dominant emotion in this context is {max(emotion_counts, key=emotion_counts.get)}."
    
    def get_insights(self, history: List[Dict]) -> str:
        """Generate automatic insights"""
        if not history:
            return "No data available."
        
        stats = EmotionDetector().get_stats() if history else None
        if not stats:
            return "No data available."
        
        counts = stats['counts']
        total = stats['total']
        most_common = stats['most_common']
        latest = stats['latest']
        
        insights = f"""
╔══════════════════════════════════════════════════════════╗
║            EMOTION ANALYSIS INSIGHTS                     ║
╚══════════════════════════════════════════════════════════╝

📊 Summary:
   • Total Records: {total}
   • Most Common: {most_common} ({counts[most_common]}x, {counts[most_common]/total*100:.1f}%)
   • Latest Emotion: {latest}

📈 Distribution:
"""
        
        for emotion, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            pct = count/total*100
            bar = "█" * int(pct/3)
            insights += f"   {emotion:12s}: {count:3d} ({pct:5.1f}%) {bar}\n"
        
        # Add analysis
        insights += "\n💡 Analysis:\n"
        
        if most_common in ['happy', 'neutral']:
            insights += "   ✅ Overall emotional state appears balanced and positive.\n"
        elif most_common in ['sad', 'angry', 'fear']:
            insights += f"   ⚠️  Predominant {most_common} emotions detected.\n"
            insights += "   💙 Consider self-care and reaching out to support.\n"
        
        # Diversity analysis
        emotion_variety = len(counts)
        if emotion_variety >= 5:
            insights += "   🎭 High emotional variety detected - showing emotional range.\n"
        elif emotion_variety <= 2:
            insights += "   📌 Limited emotional variety - emotional state appears stable.\n"
        
        return insights

# Main Application
class EmotionRAGApp:
    def __init__(self):
        Config.setup()
        self.detector = EmotionDetector()
        self.rag = EmotionRAG()
    
    def interactive_mode(self):
        """Interactive query interface"""
        print("\n" + "="*60)
        print("💬 INTERACTIVE MODE")
        print("="*60)
        print("\nCommands:")
        print("  • Type a question about your emotions")
        print("  • 'stats' - Show statistics")
        print("  • 'insights' - Get AI insights")
        print("  • 'analyze <path>' - Analyze image")
        print("  • 'webcam' - Use webcam")
        print("  • 'rebuild' - Rebuild database")
        print("  • 'quit' - Exit")
        print("="*60)
        
        # Build RAG initially
        if self.detector.history:
            self.rag.build(self.detector.history)
        
        while True:
            try:
                cmd = input("\n💭 > ").strip()
                
                if not cmd:
                    continue
                
                if cmd.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                elif cmd.lower() == 'stats':
                    self.detector.display_stats()
                
                elif cmd.lower() == 'insights':
                    insights = self.rag.get_insights(self.detector.history)
                    print(insights)
                
                elif cmd.lower().startswith('analyze '):
                    path = cmd[8:].strip()
                    self.detector.detect(path)
                    self.rag.build(self.detector.history)
                
                elif cmd.lower() == 'webcam':
                    self.detector.detect_from_webcam()
                    self.rag.build(self.detector.history)
                
                elif cmd.lower() == 'rebuild':
                    if self.rag.build(self.detector.history):
                        print("✅ Database rebuilt")
                
                else:
                    # It's a question
                    answer = self.rag.query(cmd)
                    print(f"\n💡 {answer}")
            
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Emotion Detection RAG System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python emotion_rag_app.py --image photo.jpg
  python emotion_rag_app.py --directory ./photos
  python emotion_rag_app.py --webcam
  python emotion_rag_app.py --interactive
  python emotion_rag_app.py --stats
        """
    )
    
    parser.add_argument('--image', '-i', type=str, help='Analyze single image')
    parser.add_argument('--directory', '-d', type=str, help='Analyze directory of images')
    parser.add_argument('--webcam', '-w', action='store_true', help='Use webcam')
    parser.add_argument('--interactive', '-t', action='store_true', help='Interactive mode')
    parser.add_argument('--stats', '-s', action='store_true', help='Show statistics')
    parser.add_argument('--insights', action='store_true', help='Get insights')
    parser.add_argument('--rebuild', '-r', action='store_true', help='Rebuild RAG database')
    
    args = parser.parse_args()
    
    app = EmotionRAGApp()
    
    # Execute commands
    if args.image:
        app.detector.detect(args.image)
        app.rag.build(app.detector.history)
    
    if args.directory:
        app.detector.analyze_directory(args.directory)
        app.rag.build(app.detector.history)
    
    if args.webcam:
        app.detector.detect_from_webcam()
        app.rag.build(app.detector.history)
    
    if args.stats:
        app.detector.display_stats()
    
    if args.insights:
        insights = app.rag.get_insights(app.detector.history)
        print(insights)
    
    if args.rebuild:
        app.rag.build(app.detector.history)
    
    if args.interactive or not any(vars(args).values()):
        app.interactive_mode()

if __name__ == "__main__":
    main()