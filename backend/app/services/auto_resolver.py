from app.db.database import get_ist_time, SessionLocal
from app.db.models import Complaint, AgentResolution, ModelValidation, User
from app.services.multi_model_validator import multi_model_validator
import asyncio

class AutoResolver:
    """
    Automatic Resolution Service
    Orchestrates the autonomous validation and delivery of AI solutions
    """
    
    async def process_complaint(self, complaint_id: int):
        """
        Runs the full autonomous resolution pipeline for a complaint
        Wait 5 minutes before processing to allow for natural resolution flow
        """
        print(f"⏳ Complaint {complaint_id} received. Waiting 5 minutes before auto-resolution...")
        await asyncio.sleep(300)  # Wait for 5 minutes
        
        db = SessionLocal()
        try:
            # 1. Fetch complaint
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            if not complaint:
                print(f"❌ Complaint {complaint_id} not found for auto-resolution")
                return
            
            # If already resolved or has an assigned agent who is working on it, skip
            if complaint.is_resolved:
                print(f"ℹ️ Complaint {complaint_id} is already resolved. Skipping auto-resolution.")
                return

            # Check if an agent is already actively working on this
            existing_res = db.query(AgentResolution).filter(
                AgentResolution.complaint_id == complaint_id,
                AgentResolution.status.in_(["delivered", "sent_to_customer"])
            ).first()
            if existing_res:
                print(f"ℹ️ Complaint {complaint_id} already has a delivered resolution. Skipping.")
                return

            print(f"🤖 Starting autonomous triage validation for complaint {complaint.ticket_id}...")

            # 2. Get AI Proposed Solution from complaint metadata or generate fallback
            solution = complaint.solution or "Our technical team has analyzed your issue and applied standard remediation procedures."
            steps = []
            
            # 3. Autonomous Multi-Model Cross Validation
            validation_result = await multi_model_validator.validate_resolution(
                complaint_text=f"Subject: {complaint.subject}\nDescription: {complaint.description}",
                solution_text=solution,
                category=complaint.category
            )
            
            # 4. Create AgentResolution record with System Agent
            system_agent = db.query(User).filter(User.role.in_(["Support Agent", "Admin"])).first()
            agent_id = system_agent.id if system_agent else 1
            agent_name = "TelecomIQ Autonomous AI"

            resolution = AgentResolution(
                complaint_id=complaint.id,
                agent_id=agent_id,
                solution=solution,
                status="draft",
                confidence_score=validation_result.get("confidence_score", 0.85),
                is_ai_generated=True,
                reviewed_by_human=False
            )
            db.add(resolution)
            db.commit()
            db.refresh(resolution)

            # 5. Save validation logs
            if validation_result.get("model_results"):
                for model_name, res in validation_result["model_results"].items():
                    if isinstance(res, dict):
                        model_validation = ModelValidation(
                            resolution_id=resolution.id,
                            model_name=model_name,
                            score=res.get("score", 0),
                            passed=res.get("passed", False),
                            feedback=res.get("reason", "Automatic evaluation"),
                            created_at=get_ist_time()
                        )
                        db.add(model_validation)
                db.commit()

            # 6. Deliver automatically if confidence is very high (>= 85%)
            confidence = validation_result.get("confidence_score", 0)
            status = validation_result.get("approval_status")
            
            if status == "approved" and confidence >= 0.85:
                print(f"✨ High confidence ({confidence:.2f}) detected. Marking automatic resolution...")
                
                try:
                    # Update status to delivered
                    resolution.status = "delivered"
                    resolution.resolution_timestamp = get_ist_time()
                    
                    # Mark complaint as resolved in main table
                    complaint.is_resolved = True
                    complaint.updated_at = get_ist_time()
                    
                    db.commit()
                    print(f"✅ Auto-Resolution DELIVERED safely for {complaint.ticket_id}")
                except Exception as e:
                    print(f"❌ Auto-Resolution Delivery Failed: {e}")
                    db.rollback()
            else:
                print(f"⏳ Auto-Resolution held for manual review. Confidence: {confidence:.2f}, Status: {status}")
                
        except Exception as e:
            print(f"❌ Auto-Resolution Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()

auto_resolver = AutoResolver()
